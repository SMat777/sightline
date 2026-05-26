// Static demo data captured from a local backend on 2026-05-26. The same
// payloads the live API would return, frozen so the public Vercel build can
// run without a server. Toggled by VITE_USE_FIXTURES=true at build time.

import type {
  Source, SubjectRef, DatasetRef, DatasetProfile, Finding, StatPack,
} from "../tool-types";

import sources from "./sources.json";
import dstSubjects from "./dst-subjects.json";
import odkSubjects from "./odk-subjects.json";

import bil55Profile from "./dst/BIL55-profile.json";
import bil55Findings from "./dst/BIL55-findings.json";
import bil55Stats from "./dst/BIL55-stats.json";

import enebrProfile from "./dst/ENEBR-profile.json";
import enebrFindings from "./dst/ENEBR-findings.json";
import enebrStats from "./dst/ENEBR-stats.json";

import folk1aProfile from "./dst/FOLK1A-profile.json";
import folk1aFindings from "./dst/FOLK1A-findings.json";
import folk1aStats from "./dst/FOLK1A-stats.json";

import aku110kProfile from "./dst/AKU110K-profile.json";
import aku110kFindings from "./dst/AKU110K-findings.json";
import aku110kStats from "./dst/AKU110K-stats.json";

import nan1Profile from "./dst/NAN1-profile.json";
import nan1Findings from "./dst/NAN1-findings.json";
import nan1Stats from "./dst/NAN1-stats.json";

import auk01Profile from "./dst/AUK01-profile.json";
import auk01Findings from "./dst/AUK01-findings.json";
import auk01Stats from "./dst/AUK01-stats.json";

import hfudd11Profile from "./dst/HFUDD11-profile.json";
import hfudd11Findings from "./dst/HFUDD11-findings.json";
import hfudd11Stats from "./dst/HFUDD11-stats.json";

import gf11Profile from "./dst/GF11-profile.json";
import gf11Findings from "./dst/GF11-findings.json";
import gf11Stats from "./dst/GF11-stats.json";

import mus1Profile from "./dst/MUS1-profile.json";
import mus1Findings from "./dst/MUS1-findings.json";
import mus1Stats from "./dst/MUS1-stats.json";

import trafiktalProfile from "./odk/trafiktal-profile.json";
import trafiktalFindings from "./odk/trafiktal-findings.json";
import trafiktalStats from "./odk/trafiktal-stats.json";

export const useFixtures = import.meta.env.VITE_USE_FIXTURES === "true";

// One fixture-entry per featured dataset, indexed as "{source}:{id}".
interface FixtureEntry {
  ref: DatasetRef;
  subjectId: string | null; // which subject the dataset belongs under
  profile: DatasetProfile;
  findings: Finding[];
  stats: StatPack;
}

const entries: Record<string, FixtureEntry> = {
  "danmarks-statistik:FOLK1A": {
    ref: { id: "FOLK1A", title: "Befolkningen den 1. i kvartalet", org: null, period: "2008K1–2026K2", variables: 5 },
    subjectId: "1",
    profile: folk1aProfile as DatasetProfile,
    findings: folk1aFindings as Finding[],
    stats: folk1aStats as StatPack,
  },
  "danmarks-statistik:AKU110K": {
    ref: { id: "AKU110K", title: "Arbejdsmarkedstilknytning", org: null, period: "2008K1–2025K4", variables: 4 },
    subjectId: "2",
    profile: aku110kProfile as DatasetProfile,
    findings: aku110kFindings as Finding[],
    stats: aku110kStats as StatPack,
  },
  "danmarks-statistik:NAN1": {
    ref: { id: "NAN1", title: "Forsyningsbalance, bruttonationalprodukt (BNP), økonomisk vækst, beskæftigelse mv.", org: null, period: "1966–2025", variables: 3 },
    subjectId: "3",
    profile: nan1Profile as DatasetProfile,
    findings: nan1Findings as Finding[],
    stats: nan1Stats as StatPack,
  },
  "danmarks-statistik:AUK01": {
    ref: { id: "AUK01", title: "Offentligt forsørgede (fuldtidsmodtagere)", org: null, period: "2007K1–2025K4", variables: 5 },
    subjectId: "4",
    profile: auk01Profile as DatasetProfile,
    findings: auk01Findings as Finding[],
    stats: auk01Stats as StatPack,
  },
  "danmarks-statistik:HFUDD11": {
    ref: { id: "HFUDD11", title: "Befolkningens højest fuldførte uddannelse (15-69 år)", org: null, period: "2008–2025", variables: 6 },
    subjectId: "5",
    profile: hfudd11Profile as DatasetProfile,
    findings: hfudd11Findings as Finding[],
    stats: hfudd11Stats as StatPack,
  },
  "danmarks-statistik:GF11": {
    ref: { id: "GF11", title: "Generel firmastatistik", org: null, period: "2019–2023", variables: 3 },
    subjectId: "6",
    profile: gf11Profile as DatasetProfile,
    findings: gf11Findings as Finding[],
    stats: gf11Stats as StatPack,
  },
  "danmarks-statistik:BIL55": {
    ref: { id: "BIL55", title: "Nyregistrerede personbiler", org: null, period: "2007M01–2026M04", variables: 2 },
    subjectId: "7",
    profile: bil55Profile as DatasetProfile,
    findings: bil55Findings as Finding[],
    stats: bil55Stats as StatPack,
  },
  "danmarks-statistik:MUS1": {
    ref: { id: "MUS1", title: "Aktivitet på danske museer", org: null, period: "2009–2024", variables: 4 },
    subjectId: "8",
    profile: mus1Profile as DatasetProfile,
    findings: mus1Findings as Finding[],
    stats: mus1Stats as StatPack,
  },
  "danmarks-statistik:ENEBR": {
    ref: { id: "ENEBR", title: "Industriens energiforbrug", org: null, period: "2012–2024", variables: 3 },
    subjectId: "9",
    profile: enebrProfile as DatasetProfile,
    findings: enebrFindings as Finding[],
    stats: enebrStats as StatPack,
  },
  "open-data-dk:50f7a383-653a-4860-bb4e-306f221a2d2a": {
    ref: { id: "50f7a383-653a-4860-bb4e-306f221a2d2a", title: "Trafiktal", org: "Københavns Kommune", period: null, variables: null },
    subjectId: null,
    profile: trafiktalProfile as DatasetProfile,
    findings: trafiktalFindings as Finding[],
    stats: trafiktalStats as StatPack,
  },
};

export const fixtureSources = (): Source[] => sources as Source[];

export const fixtureSubjects = (source: string): SubjectRef[] =>
  source === "danmarks-statistik"
    ? (dstSubjects as SubjectRef[])
    : (odkSubjects as SubjectRef[]);

// Curated browse experience: only the featured datasets, filtered by
// source / subject / free-text query (case-insensitive match on title or id).
export const fixtureDatasets = (
  source: string, q: string, subject: string | null,
): DatasetRef[] => {
  const needle = q.trim().toLowerCase();
  return Object.entries(entries)
    .filter(([k, e]) => k.startsWith(`${source}:`)
      && (subject == null || e.subjectId === subject)
      && (needle === "" || e.ref.title.toLowerCase().includes(needle) || e.ref.id.toLowerCase().includes(needle)))
    .map(([, e]) => e.ref);
};

const lookup = (source: string, id: string) => entries[`${source}:${id}`];

export const fixtureProfile = (source: string, id: string): DatasetProfile => {
  const e = lookup(source, id);
  if (!e) throw new Error(`Fixture missing: ${source}/${id}`);
  return e.profile;
};

export const fixtureFindings = (source: string, id: string): Finding[] => {
  const e = lookup(source, id);
  if (!e) throw new Error(`Fixture missing: ${source}/${id}`);
  return e.findings;
};

export const fixtureStats = (source: string, id: string): StatPack => {
  const e = lookup(source, id);
  if (!e) throw new Error(`Fixture missing: ${source}/${id}`);
  return e.stats;
};
