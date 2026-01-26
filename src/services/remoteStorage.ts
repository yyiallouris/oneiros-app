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


