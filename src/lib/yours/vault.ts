// IndexedDB vault. All data is local to this browser profile.
// Schema version 1.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Hypothesis,
  MessageRow,
  ModelState,
  VocabAddition,
  WeekRow,
} from "./types";
import { freshModel } from "./model";
import { EMPTY_PERSONAL, type PersonalCorpus } from "./features";

const DB_NAME = "yours-vault";
const DB_VERSION = 1;

interface YoursSchema extends DBSchema {
  messages: {
    key: number;
    value: MessageRow;
    indexes: { "by-week": number; "by-ts": number };
  };
  weeks: { key: number; value: WeekRow };
  model: { key: "current"; value: ModelState & { id: "current" } };
  corpus: { key: "personal"; value: PersonalCorpus & { id: "personal" } };
  vocab: { key: number; value: VocabAddition & { id?: number } };
  hypotheses: { key: string; value: Hypothesis };
  meta: { key: string; value: { id: string; value: unknown } };
}

let dbPromise: Promise<IDBPDatabase<YoursSchema>> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB unavailable (server context)");
  }
  if (!dbPromise) {
    dbPromise = openDB<YoursSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const msgs = db.createObjectStore("messages", {
          keyPath: "id",
          autoIncrement: true,
        });
        msgs.createIndex("by-week", "weekStart");
        msgs.createIndex("by-ts", "ts");
        db.createObjectStore("weeks", { keyPath: "weekStart" });
        db.createObjectStore("model", { keyPath: "id" });
        db.createObjectStore("corpus", { keyPath: "id" });
        db.createObjectStore("vocab", { keyPath: "id", autoIncrement: true });
        db.createObjectStore("hypotheses", { keyPath: "id" });
        db.createObjectStore("meta", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

// ---------- Messages ----------
export async function addMessage(m: MessageRow): Promise<number> {
  const db = await getDB();
  return (await db.add("messages", m)) as number;
}

export async function allMessages(): Promise<MessageRow[]> {
  const db = await getDB();
  return db.getAll("messages");
}

export async function messagesForWeek(weekStart: number): Promise<MessageRow[]> {
  const db = await getDB();
  return db.getAllFromIndex("messages", "by-week", weekStart);
}

// ---------- Weeks ----------
export async function getWeek(weekStart: number): Promise<WeekRow | undefined> {
  const db = await getDB();
  return db.get("weeks", weekStart);
}

export async function putWeek(w: WeekRow): Promise<void> {
  const db = await getDB();
  await db.put("weeks", w);
}

export async function allWeeks(): Promise<WeekRow[]> {
  const db = await getDB();
  return db.getAll("weeks");
}

// ---------- Model ----------
export async function getModel(): Promise<ModelState> {
  const db = await getDB();
  const cur = await db.get("model", "current");
  if (cur) {
    const { id: _id, ...rest } = cur;
    return rest as ModelState;
  }
  return freshModel();
}

export async function putModel(m: ModelState): Promise<void> {
  const db = await getDB();
  await db.put("model", { ...m, id: "current" } as ModelState & { id: "current" });
}

// ---------- Personal corpus ----------
export async function getCorpus(): Promise<PersonalCorpus> {
  const db = await getDB();
  const cur = await db.get("corpus", "personal");
  if (cur) {
    const { id: _id, ...rest } = cur;
    return rest as PersonalCorpus;
  }
  return EMPTY_PERSONAL;
}

export async function putCorpus(c: PersonalCorpus): Promise<void> {
  const db = await getDB();
  await db.put("corpus", { ...c, id: "personal" } as PersonalCorpus & { id: "personal" });
}

// ---------- Vocab additions ----------
export async function addVocab(v: VocabAddition): Promise<void> {
  const db = await getDB();
  await db.add("vocab", v);
}

export async function allVocab(): Promise<VocabAddition[]> {
  const db = await getDB();
  return db.getAll("vocab");
}

// ---------- Hypotheses ----------
export async function putHypothesis(h: Hypothesis): Promise<void> {
  const db = await getDB();
  await db.put("hypotheses", h);
}

export async function allHypotheses(): Promise<Hypothesis[]> {
  const db = await getDB();
  return db.getAll("hypotheses");
}

export async function deleteHypothesis(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("hypotheses", id);
}

// ---------- Export / wipe ----------
export async function exportAll(): Promise<string> {
  const db = await getDB();
  const dump = {
    version: DB_VERSION,
    exportedAt: Date.now(),
    messages: await db.getAll("messages"),
    weeks: await db.getAll("weeks"),
    model: await db.get("model", "current"),
    corpus: await db.get("corpus", "personal"),
    vocab: await db.getAll("vocab"),
    hypotheses: await db.getAll("hypotheses"),
  };
  return JSON.stringify(dump, null, 2);
}

export async function wipeAll(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear("messages"),
    db.clear("weeks"),
    db.clear("model"),
    db.clear("corpus"),
    db.clear("vocab"),
    db.clear("hypotheses"),
    db.clear("meta"),
  ]);
}
