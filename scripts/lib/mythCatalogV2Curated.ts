/** Curated Patch C V2 fields — override auto-migration for benchmark-critical records. */

export type MythFeatureV2 = { id: string; text: string };

export type MythCatalogV2Fields = {
  prompt_signature: string;
  signature_features: MythFeatureV2[];
  required_feature_groups: string[][];
  anti_features: MythFeatureV2[];
};

export const MYTH_CATALOG_V2_CURATED: Record<string, MythCatalogV2Fields> = {
  'arabian.fisherman_and_jinni': {
    prompt_signature:
      'sealed vessel found → captive power released → liberator threatened → feigned disbelief/proof challenge → being re-enters confinement → resealing reverses leverage → bargaining becomes possible',
    signature_features: [
      { id: 'sealed_vessel', text: 'sealed vessel found' },
      { id: 'released_captive_power', text: 'captive power released' },
      { id: 'threat_against_liberator', text: 'liberator threatened' },
      { id: 'proof_challenge', text: 'feigned disbelief or proof challenge' },
      { id: 'induced_reentry', text: 'being re-enters confinement' },
      { id: 'resealing', text: 'resealing the vessel' },
      { id: 'leverage_reversal', text: 'leverage reversal after reseal' },
    ],
    required_feature_groups: [
      ['sealed_vessel', 'released_captive_power'],
      ['threat_against_liberator'],
      ['proof_challenge', 'induced_reentry'],
      ['resealing', 'leverage_reversal'],
    ],
    anti_features: [
      { id: 'wish_granting_only', text: 'wish-granting without threat/reseal' },
      { id: 'magical_being_only', text: 'magical being only' },
      { id: 'vessel_only', text: 'vessel only' },
    ],
  },
  'greek.sisyphus': {
    prompt_signature:
      'solitary uphill stone labor → near summit → inevitable rollback → return to base → exact same labor restarts without completion',
    signature_features: [
      { id: 'uphill_stone_labor', text: 'solitary uphill stone labor' },
      { id: 'near_summit', text: 'near summit' },
      { id: 'rollback', text: 'inevitable rollback' },
      { id: 'return_to_base', text: 'return to base' },
      { id: 'exact_restart', text: 'exact same labor restarts' },
      { id: 'no_completion', text: 'no completion' },
    ],
    required_feature_groups: [
      ['uphill_stone_labor'],
      ['near_summit', 'rollback'],
      ['return_to_base', 'exact_restart'],
      ['no_completion'],
    ],
    anti_features: [],
  },
  'greek.orpheus_eurydice': {
    prompt_signature:
      'beloved lost beyond death/threshold → lover crosses to retrieve → conditional return with no-look rule → ascent toward life/light → backward look before threshold cleared → second irreversible loss',
    signature_features: [
      { id: 'lost_beloved', text: 'beloved lost beyond death or threshold' },
      { id: 'retrieval_crossing', text: 'lover crosses to retrieve' },
      { id: 'conditional_return', text: 'conditional return' },
      { id: 'no_look_rule', text: 'no-look rule' },
      { id: 'backward_look', text: 'backward look before threshold cleared' },
      { id: 'second_loss', text: 'second irreversible loss' },
    ],
    required_feature_groups: [
      ['lost_beloved', 'retrieval_crossing'],
      ['conditional_return', 'no_look_rule'],
      ['backward_look', 'second_loss'],
    ],
    anti_features: [],
  },
  'sumerian.inanna_descent': {
    prompt_signature:
      'voluntary underworld descent → seven successive gates → one regalia/status item removed at each gate → arrival before underworld queen → deathlike suspension → revival by two small rescuing beings → return under altered conditions',
    signature_features: [
      { id: 'seven_gates', text: 'seven successive gates' },
      { id: 'successive_stripping', text: 'regalia removed at each gate' },
      { id: 'underworld_queen_encounter', text: 'underworld queen encounter' },
      { id: 'deathlike_suspension', text: 'deathlike suspension' },
      { id: 'two_rescuing_beings', text: 'revival by two small rescuing beings' },
      { id: 'revival', text: 'revival' },
      { id: 'altered_return', text: 'return under altered conditions' },
    ],
    required_feature_groups: [
      ['seven_gates', 'successive_stripping'],
      ['underworld_queen_encounter'],
      ['deathlike_suspension'],
      ['two_rescuing_beings', 'revival'],
      ['altered_return'],
    ],
    anti_features: [
      { id: 'no_successive_stripping', text: 'no successive stripping across gates' },
      { id: 'single_threshold_only', text: 'single-threshold descent without progressive loss' },
    ],
  },
  'kiche_maya.hero_twins_xibalba': {
    prompt_signature:
      'paired hero twins descend to Xibalba → deceptive lords impose trials → twins strategically endure sacrifice/death → revive → defeat or humiliate underworld lords → celestial transformation',
    signature_features: [
      { id: 'paired_twins', text: 'paired hero twins' },
      { id: 'xibalba_trials', text: 'Xibalba trials' },
      { id: 'adversarial_contests', text: 'adversarial contests' },
      { id: 'strategic_death', text: 'strategic sacrifice or death' },
      { id: 'self_revival', text: 'twins revive themselves' },
      { id: 'defeat_underworld_lords', text: 'defeat underworld lords' },
    ],
    required_feature_groups: [
      ['paired_twins'],
      ['xibalba_trials', 'adversarial_contests'],
      ['strategic_death', 'self_revival'],
      ['defeat_underworld_lords'],
    ],
    anti_features: [
      { id: 'two_helpers_only', text: 'two helper figures only' },
      { id: 'single_protagonist', text: 'single descending protagonist' },
      { id: 'helper_revival', text: 'revival performed by helpers' },
    ],
  },
  'greek.psyche_eros': {
    prompt_signature:
      'secret union with hidden lover → forbidden sight/trust condition broken → lover lost → imposed tasks → underworld task/descent → reunion and transformation',
    signature_features: [
      { id: 'hidden_lover', text: 'secret union with hidden lover' },
      { id: 'forbidden_sight', text: 'forbidden sight or trust condition' },
      { id: 'taboo_breach', text: 'taboo breach' },
      { id: 'lover_lost', text: 'lover lost' },
      { id: 'imposed_tasks', text: 'imposed tasks' },
      { id: 'descent_for_reunion', text: 'underworld task or descent' },
      { id: 'reunion', text: 'reunion and transformation' },
    ],
    required_feature_groups: [
      ['hidden_lover', 'forbidden_sight'],
      ['taboo_breach', 'lover_lost'],
      ['imposed_tasks'],
      ['descent_for_reunion', 'reunion'],
    ],
    anti_features: [
      { id: 'descent_without_separation', text: 'descent without lover separation' },
      { id: 'stripping_without_tasks', text: 'stripping without imposed tasks' },
      { id: 'revival_without_hidden_lover', text: 'revival without hidden-lover structure' },
    ],
  },
};
