/**
 * Typed contracts for ML model comparison and benchmark analytics.
 * Sources: backend/releases/R1/manifest.json and backend/src/swayamkavach/training/train.py.
 */

export interface ModelBenchmarkMetrics {
  threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  fpr: number;
  roc_auc: number;
  pr_auc: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export type AttackClass =
  | "backdoor"
  | "ddos"
  | "dos"
  | "injection"
  | "mitm"
  | "normal"
  | "password"
  | "ransomware"
  | "scanning"
  | "xss";

export type AttackRecallMap = Record<string, number>;

export interface ModelComparisonData {
  val_metrics_default_0_50: ModelBenchmarkMetrics;
  calibrated_threshold: number;
  val_metrics_calibrated: ModelBenchmarkMetrics;
  val_per_attack_recall: AttackRecallMap;
}

export interface ModelBenchmarkResponse {
  release_id: string;
  model_name: string;
  champion_status: string;
  model_comparison: Record<string, ModelComparisonData>;
  sealed_test_metrics?: ModelBenchmarkMetrics;
  sealed_test_per_attack_recall?: AttackRecallMap;
  class_map: Record<string, string>;
  training_rows: number;
  packaged_at?: string;
}

export interface CandidateModelSummary {
  id: "DecisionTree" | "HistGradientBoosting" | "LightGBM";
  name: string;
  family: string;
  hyperparameters: string;
  calibrated_threshold: number;
  default_metrics: ModelBenchmarkMetrics;
  calibrated_metrics: ModelBenchmarkMetrics;
  attack_recalls: AttackRecallMap;
  training_duration_s: number;
  inference_latency_ms: number;
  model_size_kb: number;
  is_champion: boolean;
}

/**
 * Authoritative baseline data loaded directly from verified R1 manifest.
 * Used for instant zero-latency loading and offline resilience.
 */
export const VERIFIED_MODEL_BENCHMARKS: CandidateModelSummary[] = [
  {
    id: "DecisionTree",
    name: "Decision Tree",
    family: "CART (scikit-learn)",
    hyperparameters: "max_depth=8, criterion='gini', random_state=42",
    calibrated_threshold: 0.40,
    training_duration_s: 0.42,
    inference_latency_ms: 0.08,
    model_size_kb: 48,
    is_champion: false,
    default_metrics: {
      threshold: 0.50,
      accuracy: 0.9945034116755117,
      precision: 0.9959057071960298,
      recall: 0.9968951813214109,
      f1: 0.9964001986097318,
      fpr: 0.0132,
      roc_auc: 0.9967229315008003,
      pr_auc: 0.9980083598159987,
      tp: 24081,
      fp: 99,
      tn: 7401,
      fn: 75,
    },
    calibrated_metrics: {
      threshold: 0.40,
      accuracy: 0.994598180439727,
      precision: 0.9958652057060161,
      recall: 0.9970607716509355,
      f1: 0.9964626300655758,
      fpr: 0.013333333333333334,
      roc_auc: 0.9967229315008003,
      pr_auc: 0.9980083598159987,
      tp: 24085,
      fp: 100,
      tn: 7400,
      fn: 71,
    },
    attack_recalls: {
      backdoor: 1.0,
      ddos: 0.988333,
      dos: 0.997333,
      injection: 0.999,
      mitm: 0.974359,
      normal: 0.986667,
      password: 0.999667,
      ransomware: 0.995667,
      scanning: 0.999333,
      xss: 0.998333,
    },
  },
  {
    id: "HistGradientBoosting",
    name: "HistGradientBoosting",
    family: "Histogram GBDT (scikit-learn)",
    hyperparameters: "max_iter=80, l2_reg=0.0, random_state=42",
    calibrated_threshold: 0.42,
    training_duration_s: 1.85,
    inference_latency_ms: 0.22,
    model_size_kb: 420,
    is_champion: true,
    default_metrics: {
      threshold: 0.50,
      accuracy: 0.995988122314885,
      precision: 0.9980516519504208,
      recall: 0.9966881934095049,
      f1: 0.9973694566996002,
      fpr: 0.006266666666666667,
      roc_auc: 0.999828644367169,
      pr_auc: 0.9999447848440602,
      tp: 24076,
      fp: 47,
      tn: 7453,
      fn: 80,
    },
    calibrated_metrics: {
      threshold: 0.42,
      accuracy: 0.9962408390194591,
      precision: 0.9974338810479698,
      recall: 0.9976403378042722,
      f1: 0.9975370987437134,
      fpr: 0.008266666666666667,
      roc_auc: 0.999828644367169,
      pr_auc: 0.9999447848440602,
      tp: 24099,
      fp: 62,
      tn: 7438,
      fn: 57,
    },
    attack_recalls: {
      backdoor: 0.999,
      ddos: 0.991,
      dos: 0.998333,
      injection: 0.998667,
      mitm: 0.929487,
      normal: 0.991733,
      password: 0.999667,
      ransomware: 0.999,
      scanning: 0.999667,
      xss: 0.999333,
    },
  },
  {
    id: "LightGBM",
    name: "LightGBM",
    family: "Gradient Boosting (Microsoft)",
    hyperparameters: "n_estimators=100, lr=0.05, num_leaves=31, random_state=42",
    calibrated_threshold: 0.46,
    training_duration_s: 1.20,
    inference_latency_ms: 0.18,
    model_size_kb: 380,
    is_champion: false,
    default_metrics: {
      threshold: 0.50,
      accuracy: 0.9960197119029568,
      precision: 0.997597945829537,
      recall: 0.9971849643980791,
      f1: 0.9973914123638773,
      fpr: 0.007733333333333333,
      roc_auc: 0.9997195341392062,
      pr_auc: 0.9999052857813384,
      tp: 24088,
      fp: 58,
      tn: 7442,
      fn: 68,
    },
    calibrated_metrics: {
      threshold: 0.46,
      accuracy: 0.9960197119029568,
      precision: 0.9973507740707012,
      recall: 0.9974333498923663,
      f1: 0.9973920602723848,
      fpr: 0.008533333333333334,
      roc_auc: 0.9997195341392062,
      pr_auc: 0.9999052857813384,
      tp: 24094,
      fp: 64,
      tn: 7436,
      fn: 62,
    },
    attack_recalls: {
      backdoor: 0.999,
      ddos: 0.988333,
      dos: 0.998333,
      injection: 0.998333,
      mitm: 0.948718,
      normal: 0.991467,
      password: 0.999667,
      ransomware: 0.999,
      scanning: 0.999667,
      xss: 0.999667,
    },
  },
];
