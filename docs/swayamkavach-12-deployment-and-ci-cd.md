# SwayamKavach — 12 Deployment and CI/CD

Single-host Docker/Nginx reference deployment, secure networking, artifact persistence, GitHub Actions release flow and rollback/restore runbooks.

## Deployment modes and service topology

# 12 · Deployment, Docker, Nginx and CI/CD

**Reference target:** one Linux host with Docker Compose, host Nginx, a narrowly privileged controller/watchdog and an authorized sensor. This is recoverable single-host infrastructure, not HA. Configuration below is annotated scaffolding: placeholder variables, application modules and deployment scripts must be implemented and tested. No stack was deployed or load-tested during this research.

## Environment progression
| Environment | Purpose | Data/actions |
|---|---|---|
| Local development | Fixtures, API/UI contracts, small training | Synthetic/sanitized fixtures; no LAN capture required |
| Staging/replay | Integration, crash, canary and restore tests | Versioned PCAP/flow replay with independent delayed labels |
| Live pilot | Verify real capture/inference/operations | Authorized interfaces; advisory alerts; supervised promotion unless evidence policy permits otherwise |

Separate Compose project names, ports, DBs, artifact roots, secrets and DVC remotes/prefixes. A staging job must not mutate a live deployment. One host can run environments sequentially if resources are tight; shared hardware does not justify shared credentials/state.

## Runtime services
- `api`: FastAPI control/ingestion, loopback-published for host Nginx.
- `inference_consumer`: durable flow-work consumer, separate from CPU training.
- `lifecycle_worker`: monitoring, LangGraph checkpoints and one bounded training subprocess.
- `serve_a`, `serve_b`: fixed ports, immutable image/model release per incarnation.
- `postgres`: separate application/MLflow databases and users; persistent volume.
- `mlflow`: private tracking/registry and artifact access.
- `prometheus`, `grafana`: private observability, bounded retention.
- `frontend`: Next.js, loopback-published behind Nginx.
- Host services: Nginx, narrow deployment controller/watchdog, optional sensor.

**Networking detail:** a container's `127.0.0.1` is not the host. The inference consumer must reach a private host-Nginx listener through an explicitly configured bridge/gateway address, not the host's loopback. On Linux, an `extra_hosts: host.docker.internal:host-gateway` mapping can name that gateway. Bind the private listener to the chosen bridge address and firewall it to the intended containers; add service authentication. Verify the actual bridge/interface address rather than assuming a subnet. Public UI/API use HTTPS; Postgres, MLflow, slot ports and private inference are not publicly exposed.

Prometheus can scrape slot/service names on a restricted Compose network. Slot HTTP ports published to host loopback let host Nginx reach stable endpoints even when container IPs change. A containerized gateway is an alternative, but requires different address-resolution/reload and privilege design.

**Resource admission:** measure baseline host footprint + two loaded releases + training peak + capture/queue/artifact storage + safety headroom. If that exceeds the machine, cap/subset training, move training to another authorized host, or pause optional services. Do not invent minimum RAM/throughput guarantees. Limit LightGBM threads so fitting cannot starve serving.

## Docker and persistence specification

## Compose fragment
This is only the core dependency/network pattern, not a complete runnable file. All `${...}` values need an environment-specific manifest; image variables must resolve to digests. Application secret-file handling is code you must implement.

```yaml
services:
  postgres:
    image: ${POSTGRES_IMAGE_DIGEST}
    environment:
      POSTGRES_USER: bootstrap
      POSTGRES_DB: bootstrap
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_bootstrap_password
    secrets: [pg_bootstrap_password]
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: [CMD-SHELL, 'pg_isready -U bootstrap -d bootstrap']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  api:
    image: ${APP_IMAGE_DIGEST}
    command: [python, -m, swayamkavach.api]
    ports: ['127.0.0.1:8000:8000']
    environment:
      APP_CONFIG: /config/app.yaml
      APP_DB_DSN_FILE: /run/secrets/app_db_dsn
    secrets: [app_db_dsn]
    volumes: ['./config:/config:ro']
    depends_on:
      postgres: {condition: service_healthy}
    read_only: true
    tmpfs: [/tmp]
    cap_drop: [ALL]
    restart: unless-stopped

  inference_consumer:
    image: ${APP_IMAGE_DIGEST}
    command: [python, -m, swayamkavach.inference_consumer]
    extra_hosts: ['host.docker.internal:host-gateway']
    environment:
      PREDICT_URL: http://host.docker.internal:8090/predict
      APP_DB_DSN_FILE: /run/secrets/app_db_dsn
    secrets: [app_db_dsn, inference_service_token]
    depends_on:
      postgres: {condition: service_healthy}
    restart: unless-stopped

  serve_a:
    image: ${SERVE_A_IMAGE_DIGEST}
    command: [python, -m, swayamkavach.serving]
    ports: ['127.0.0.1:8101:8000']
    environment:
      RELEASE_MANIFEST: /release/manifest.json
      SLOT: A
    volumes: ['${RELEASE_A_DIR}:/release:ro']
    read_only: true
    tmpfs: [/tmp]
    cap_drop: [ALL]
    restart: unless-stopped

  serve_b:
    image: ${SERVE_B_IMAGE_DIGEST}
    command: [python, -m, swayamkavach.serving]
    ports: ['127.0.0.1:8102:8000']
    environment:
      RELEASE_MANIFEST: /release/manifest.json
      SLOT: B
    volumes: ['${RELEASE_B_DIR}:/release:ro']
    read_only: true
    tmpfs: [/tmp]
    cap_drop: [ALL]
    restart: unless-stopped

volumes:
  pgdata:
secrets:
  pg_bootstrap_password:
    file: ./secrets/pg-bootstrap-password
  app_db_dsn:
    file: ./secrets/app-db-dsn
  inference_service_token:
    file: ./secrets/inference-service-token
```

The healthcheck durations above are illustrative startup settings, not model-quality thresholds. Pin a PostgreSQL release and verify its documented data-directory layout; the sample mount path must match that release. Bootstrap separate least-privilege application/MLflow users rather than using the bootstrap superuser from applications. Initialize schema migrations explicitly.

Complete the file with worker, MLflow, UI, Prometheus and Grafana services; non-root users, healthchecks, effective `cpus`/`mem_limit`/`pids_limit`, stop grace periods, log rotation and network isolation. Verify Compose/runtime support and inspect effective resource limits. `depends_on` readiness is startup coordination, not continuous health-based restart/routing. A running but unhealthy container does not automatically restart merely because a healthcheck fails. [1–2]

## Artifact and database storage
Persist Postgres, MLflow artifacts, DVC cache/remote objects and monitoring configuration/state separately. For lowest setup cost use protected host/volume storage plus an **off-host backup**; object storage is preferable when available. MLflow metadata DB is not its artifact store. With artifact proxying, restrict the server's effective object access. [3]

Compose secrets mount files; they are not automatically encrypted-at-rest secret management. Protect source files, rotate credentials and never commit them. No Docker socket in API, UI or generic agent worker. Model loaders accept only trusted, checksum-verified bundles; pickle-family loading can execute code. [4–5]

## Nginx and rollout controller

## Weighted routing fragment
The example 9:1 weights are an illustrative nominal 10% request canary, not the recommended safety policy. The controller renders approved weights from versioned intent.

```nginx
upstream ids_slots {
    server 127.0.0.1:8101 weight=9;
    server 127.0.0.1:8102 weight=1;
    keepalive 16;
}

# Private listener: replace with verified bridge address, never public wildcard.
server {
    listen <HOST_BRIDGE_ADDRESS>:8090;
    # Add firewall/allow rules and authenticated service access.
    location = /predict {
        proxy_pass http://ids_slots/predict;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_next_upstream off;
        add_header X-Swayam-Generation "<APPLIED_GENERATION>" always;
    }
}

# Inside the public HTTPS server after TLS/auth configuration:
location /api/ {
    proxy_pass http://127.0.0.1:8000;
}
location /api/v1/events/stream {
    proxy_pass http://127.0.0.1:8000;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 120s;
}
location / {
    proxy_pass http://127.0.0.1:3000;
}
```

TLS certificates, body/concurrency/time limits, access rules and authentication are intentionally not faked by this fragment. The SSE read timeout is illustrative and must exceed configured heartbeat gaps. `proxy_next_upstream off` avoids hidden cross-slot retry contamination; the application records explicit attempts and retries under policy. Passive upstream health/failure behavior also affects observed canary share and must be tested or explicitly configured. [6]

Weighted round-robin is already available in Nginx OSS; `split_clients` is an alternative for stable hashed cohorts, not a requirement. Use trusted cohort keys, not caller-controlled arbitrary strings or NAT IP as assumed device identity. For zero traffic, remove/mark an upstream down rather than setting weight zero. `keepalive 16` concerns idle connection caching per worker, not a concurrency limit. [6–7]

## Restricted controller protocol
Only a host service with narrow permitted operations can update approved slot containers/config. It must not accept arbitrary shell text or filesystem paths from graph state.

1. Claim desired deployment generation under a DB fence and host lock.
2. Validate release signature/checksum/provenance; stage inactive slot and test identity/readiness.
3. Render versioned Nginx config from a fixed template; run config validation.
4. Atomically install the config file/directory entry; reload Nginx.
5. Probe new connections for generation and actual slot identities; record observed state.
6. Monitor clean-window traffic and enforce progression/rollback policy.

A reload starts new workers and drains old ones; signal success is not observed traffic convergence. Keep predecessor processes alive while old requests drain. Bound draining deliberately and report any interrupted requests. No claim of zero downtime until tested under the offered load. [8]

Two-slot retention is a hard constraint: staging another candidate overwrites the previous rollback target. Defer new releases until stabilization/retention policy permits reuse, or add a third slot with measured resource cost.

## CI/CD and operational runbooks

## Two release loops
**Application CI/CD:** code/schema/controller changes → tests → build once → immutable image digest → staging → controlled deploy. **Model lifecycle:** snapshot → train → evaluate → stage exact model under a compatible tested image → canary/rollback. A model retrain does not require a GitHub Actions image rebuild unless dependencies or serving code changed.

### GitHub Actions workflow design
```yaml
name: application-ci
on: [push, pull_request]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<REVIEWED_FULL_COMMIT_SHA>
      - uses: astral-sh/setup-uv@<REVIEWED_FULL_COMMIT_SHA>
        with:
          enable-cache: true
      - run: uv sync --frozen
      - run: uv run pytest tests/unit tests/contracts
      - run: docker compose -f compose.test.yaml up --abort-on-container-exit --exit-code-from tests
```

Placeholders make this intentionally non-runnable until reviewed versions/scripts exist. Add a separately gated trusted-branch/tag job for image build/push, with `packages: write` only there. Do not give untrusted pull requests production credentials. Pin third-party Actions to reviewed full commit SHAs; lock Python/Node dependencies; test application/image vulnerabilities according to available tooling. [9]

**Test stages:** schema/feature fixtures → model log/load equivalence → API/DB migrations → graph crash/resume → DVC fresh restore → Compose readiness/integration → concurrent canary/reload → exact predecessor rollback → backup restore. Avoid downloading huge datasets in every PR; use small sanitized fixtures and run full experiments separately.

**Publish/deploy:** push GHCR image, capture digest and deploy `image@sha256:...`, not `latest`. Keep the predecessor image/artifacts available; content identity does not guarantee retention. Use a protected deployment environment where the repository plan supports it and a common deployment concurrency group that does not cancel an active mutation. Serialize with the same application controller lease used by model rollouts. [10–11]

SSH from a trusted runner to a restricted host command is a valid option; use verified host keys and scoped credentials. Alternatives: an isolated trusted self-hosted runner or pull-based controller. Never run untrusted PR code on the production host. The platform used to research this project does not dictate your deployment transport.

## Restore and failure runbooks
- **Training/worker crash:** recover lease/checkpoint, reconcile effect ledger, retry only classified transient failures.
- **Bad candidate:** fence progression, verify warm predecessor, apply/observe rollback generation, quarantine candidate.
- **DB unavailable:** last-applied inference route remains; durable ingestion/new transitions stop. A separately tested local emergency rollback path may restore only a validated predecessor/config and journal recovery. Otherwise report degraded capability honestly.
- **Host loss:** restore DB backup, artifacts and release manifests on a compatible host; validate checksums/identities; reconstruct routing before enabling ingestion. Model containers alone are insufficient.
- **Disk pressure:** stop admission/training before corrupting state, alert, apply retention policy; never delete referenced DVC/release data opportunistically.

Back up DB plus artifact/DVC objects and deployment manifests coherently; record backup time and restore-point objective. Test restoration. Persistent volumes are not backups. Never use `docker compose down -v` in ordinary deployment/rollback scripts. Use expand/contract database migrations compatible with the retained application release; model rollback cannot undo a breaking DB or extractor migration.

## Real environment checklist
Authorized capture point; verified visibility of intended devices; narrow capabilities rather than `privileged: true`; clock synchronization; bounded PCAP/feature retention; TLS sensor transport; no publicly exposed DB/MLflow; trusted label process; resource/load measurements; tested operator access and emergency shutdown. Live monitoring success is not live model-quality validation without labels.

### Sources
1. [Compose startup ordering](https://docs.docker.com/compose/how-tos/startup-order/).
2. [Compose service configuration](https://docs.docker.com/reference/compose-file/services/).
3. [MLflow artifact storage](https://mlflow.org/docs/latest/self-hosting/architecture/artifact-store/).
4. [Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/) and [Docker security](https://docs.docker.com/engine/security/).
5. [sklearn model persistence security/compatibility](https://scikit-learn.org/stable/model_persistence.html).
6. [Nginx upstream module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html) and [proxy module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).
7. [Nginx split_clients](https://nginx.org/en/docs/http/ngx_http_split_clients_module.html).
8. [Nginx reload semantics](https://nginx.org/en/docs/control.html).
9. [GitHub Actions security hardening](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions).
10. [GHCR image digest usage](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).
11. [GitHub deployment controls](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments).
12. [Docker host networking](https://docs.docker.com/engine/network/drivers/host/).

See 02 for state ownership, 08 for release manifests and 09 for exact rollout policy.

## Implementation addendum: fencing, draining and compatibility

## Fencing the actual host mutation
A DB lease by itself cannot prevent an expired process from writing an Nginx file. All writers—including normal rollout, manual rollback and emergency recovery—must use one host-side exclusive lock and the same narrow mutation code. No other worker may have config/container-write permissions.

Separate slow candidate staging from the critical routing mutation. Under the host lock, reload the current durable intent and validate operation ID, lease/fence, expected applied generation, candidate/predecessor identities and approval. Reject lower/replayed fences using a persisted local mutation journal. Recheck before installation, write a journal record for prepared config/hash, apply, then record observed result. Hold the host lock through install/reload/observation or explicit recovery handoff. A newer controller waits for the host lock and reconciles reality before applying anything; it must not trust only a DB lease takeover.

There is still no atomic transaction between Postgres and Nginx. A changed intent or connection failure at the check/apply boundary produces a reconcilable intermediate state, not a claim of perfect distributed exclusion. The journal records which config was actually installed, and the controller never reports an unobserved operation as successful.

For an emergency DB-outage rollback, write a local emergency generation/hold marker before reverting. On DB recovery, do not blindly replay the older desired canary state. Reconcile local emergency state into the deployment ledger, quarantine the failed release and require fresh authorization before progression.

## Applied does not mean fully drained
A fresh probe observing the new generation proves new configuration is reachable; it does not prove all requests have stopped using old workers. Distinguish `new_generation_observed` from `drain_complete`. Collect actual response generation/release attribution, old-worker lifecycle and in-flight request telemetry. Bound inference request/connection lifetimes. Long SSE connections share Nginx worker draining concerns and must reconnect from durable event cursors if a configured shutdown deadline closes them.

Do not stop or reuse a slot while an old routing worker may still send it traffic. Reclaim only after old workers have exited and relevant in-flight work has completed, or after an explicit forced-drain deadline whose interrupted requests are recorded. The rollback timing report separates new-route activation from complete drain; no zero-loss guarantee follows from a successful reload signal.

## Feature compatibility across rollback
A model-only canary requires champion and candidate to accept the same external feature contract. A five-feature versus eleven-feature ablation may select an internal subset from one fixed external schema, but an incompatible sensor/extractor schema change is a coordinated application/data-plane migration, not an ordinary model update. Maintain predecessor-compatible adapters through stabilization or deploy parallel versioned ingestion paths and drain old events deliberately. Model rollback cannot repair a newly incompatible shared extractor.

Load/overload tests must include ingestion backlog, DB/disk pressure, two warm models and the training peak simultaneously. Resource limits and retention defaults are mandatory deployment configuration even though this research does not invent hardware-specific values.
