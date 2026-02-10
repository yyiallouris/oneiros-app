import { supabase } from './supabaseClient';
import { Dream, Interpretation } from '../types/dream';
import { logEvent, logError } from './logger';

// Helper: get current authenticated user id from Supabase
async function getUserId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    logEvent('auth_get_user_success', { userId: data.user.id });
    return data.user.id;
  } catch {
    logError('auth_get_user_error', new Error('Failed to get Supabase user'));
    return null;
  }
}

// Map Dream <-> DB row
// Note: archetypes and symbols are NOT stored in dreams table
// They are only stored in interpretations table and locally in AsyncStorage
type DreamRow = {
  id: string;
  user_id: string;
  date: string;
  title: string | null;
  content: string;
  symbol: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

type InterpretationRow = {
  id: string;
  user_id: string;
  dream_id: string;
  symbols: string[];
  archetypes: string[];
  landscapes?: string[];
  affects?: string[];
  motifs?: string[];
  relational_dynamics?: string[];
  core_mode?: string | null;
  amplifications?: string[];
  summary: string | null;
  messages: any[];
  created_at: string;
  updated_at: string;
};

function mapDreamRowToDream(row: DreamRow): Dream {
  return {
    id: row.id,
    date: row.date,
    title: row.title ?? undefined,
    content: row.content,
    symbol: row.symbol ?? undefined,
    archived: row.archived,
    // archetypes and symbols are not stored in dreams table
    // They come from local AsyncStorage and interpretations table
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDreamToRow(dream: Dream, userId: string): Partial<DreamRow> {
  return {
    id: dream.id,
    user_id: userId,
    date: dream.date,
    title: dream.title ?? null,
    content: dream.content,
    symbol: dream.symbol ?? null,
    archived: dream.archived ?? true,
    // archetypes and symbols are NOT saved to dreams table
    // They are stored locally in AsyncStorage and in interpretations table
  };
}

function mapInterpretationRowToInterpretation(row: InterpretationRow): Interpretation {
  return {
    id: row.id,
    dreamId: row.dream_id,
    messages: row.messages as any,
    symbols: row.symbols,
    archetypes: row.archetypes,
    landscapes: row.landscapes && row.landscapes.length > 0 ? row.landscapes : undefined,
    affects: row.affects && row.affects.length > 0 ? row.affects : undefined,
    motifs: row.motifs && row.motifs.length > 0 ? row.motifs : undefined,
    relational_dynamics: row.relational_dynamics && row.relational_dynamics.length > 0 ? row.relational_dynamics : undefined,
    core_mode: row.core_mode && row.core_mode.trim() ? row.core_mode : undefined,
    amplifications: row.amplifications && row.amplifications.length > 0 ? row.amplifications : undefined,
    summary: row.summary ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInterpretationToRow(
  interpretation: Interpretation,
  userId: string
): Partial<InterpretationRow> {
  return {
    id: interpretation.id,
    user_id: userId,
    dream_id: interpretation.dreamId,
    symbols: interpretation.symbols,
    archetypes: interpretation.archetypes,
    landscapes: interpretation.landscapes,
    affects: interpretation.affects,
    motifs: interpretation.motifs,
    relational_dynamics: interpretation.relational_dynamics,
    core_mode: interpretation.core_mode ?? null,
    amplifications: interpretation.amplifications,
    summary: interpretation.summary ?? null,
    messages: interpretation.messages as any[],
  };
}

// Remote dreams API
export async function remoteGetDreams(): Promise<Dream[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('dreams')
    .select('*')
    .eq('user_id', userId) // SECURITY: Only fetch dreams for the current user
    .order('date', { ascending: false });

  if (error || !data) {
    logError('remote_get_dreams_error', error);
    return null;
  }
  logEvent('remote_get_dreams_success', { count: data.length });
  return (data as DreamRow[]).map(mapDreamRowToDream);
}

export async function remoteSaveDream(dream: Dream): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  // SECURITY: If dream already exists, verify ownership before updating
  if (dream.id) {
    const { data: existingDream, error: fetchError } = await supabase
      .from('dreams')
      .select('user_id')
      .eq('id', dream.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new dreams
      logError('remote_save_dream_ownership_check_error', fetchError, { dreamId: dream.id });
      return;
    }

    // If dream exists and belongs to another user, reject the update
    if (existingDream && existingDream.user_id !== userId) {
      logError('remote_save_dream_ownership_violation', new Error('User does not own this dream'), {
        dreamId: dream.id,
        userId,
        ownerId: existingDream.user_id,
      });
      return;
    }
  }

  const payload = mapDreamToRow(dream, userId);
  const { error } = await supabase.from('dreams').upsert(payload as any, {
    onConflict: 'id',
  });

  if (error) {
    logError('remote_save_dream_error', error, { dreamId: dream.id });
  } else {
    logEvent('remote_save_dream_success', { dreamId: dream.id });
  }
}

export async function remoteDeleteDream(dreamId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase
    .from('dreams')
    .delete()
    .eq('id', dreamId)
    .eq('user_id', userId);

  if (error) {
    logError('remote_delete_dream_error', error, { dreamId });
  } else {
    logEvent('remote_delete_dream_success', { dreamId });
  }
}

// Remote interpretations API
export async function remoteGetInterpretations(): Promise<Interpretation[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('interpretations')
    .select('*')
    .eq('user_id', userId) // SECURITY: Only fetch interpretations for the current user
    .order('created_at', { ascending: false });

  if (error || !data) {
    logError('remote_get_interpretations_error', error);
    return null;
  }
  logEvent('remote_get_interpretations_success', { count: data.length });
  return (data as InterpretationRow[]).map(mapInterpretationRowToInterpretation);
}

export async function remoteSaveInterpretation(
  interpretation: Interpretation
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  // SECURITY: If interpretation already exists, verify ownership before updating
  if (interpretation.id) {
    const { data: existingInterpretation, error: fetchError } = await supabase
      .from('interpretations')
      .select('user_id')
      .eq('id', interpretation.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new interpretations
      logError('remote_save_interpretation_ownership_check_error', fetchError, {
        interpretationId: interpretation.id,
      });
      return;
    }

    // If interpretation exists and belongs to another user, reject the update
    if (existingInterpretation && existingInterpretation.user_id !== userId) {
      logError(
        'remote_save_interpretation_ownership_violation',
        new Error('User does not own this interpretation'),
        {
          interpretationId: interpretation.id,
          userId,
          ownerId: existingInterpretation.user_id,
        }
      );
      return;
    }
  }

  const payload = mapInterpretationToRow(interpretation, userId);
  const { error } = await supabase.from('interpretations').upsert(payload as any, {
    onConflict: 'id',
  });

  if (error) {
    logError('remote_save_interpretation_error', error, { interpretationId: interpretation.id });
  } else {
    logEvent('remote_save_interpretation_success', { interpretationId: interpretation.id });
  }
}

export async function remoteDeleteInterpretation(id: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase
    .from('interpretations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logError('remote_delete_interpretation_error', error, { id });
  } else {
    logEvent('remote_delete_interpretation_success', { id });
  }
}


