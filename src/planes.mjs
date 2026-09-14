// Where each plane lives on disk, named once.
//
// These paths were twenty string literals across six modules and five test files, which is exactly
// the shape that loses one on a rename — and a lost one does not fail loudly: the extractor keeps
// writing to the old path, the gate keeps comparing the old path, and the corpus quietly grows a
// second copy of itself.
//
// The layout says which plane a file belongs to, because nothing else did. `entries/` and
// `derived/` used to be the same plane under two names while `captured/` was the other one, so a
// reader opening the base could not tell from the tree which half was regenerated and which was
// written by hand — the single most important thing to know about any file in it.
//
//   derived/            the projected plane. Regenerated wholesale, byte-compared, never edited.
//     entries/          one .md per capability surface
//     rest/ graphql/    the contract tables those entries cite
//     pin.json …        what the projection was taken from
//   captured/           the written plane. One .md per fact an agent recorded.
//
// The experiential plane stays flat: it holds entries and nothing else, so a nested `entries/`
// there would be a directory with no siblings, added only to make two trees look alike.

export const DERIVED_DIR = 'derived';
export const DERIVED_ENTRIES = 'derived/entries';
export const DERIVED_INDEX = 'derived-index.json';
export const DERIVED_CATALOG = 'derived-catalog.md';

export const CAPTURED_DIR = 'captured';
export const CAPTURED_INDEX = 'captured-index.json';
export const CAPTURED_CATALOG = 'captured-catalog.md';

// Everything the extractor writes, and therefore everything it is responsible for removing. The
// captured plane is deliberately absent: it is written by agents rather than regenerated, so a
// byte-compare against a regeneration would be meaningless and `kb extract` must never wipe it.
export const OWNED_ROOTS = [DERIVED_DIR];
export const OWNED_FILES = [DERIVED_CATALOG, DERIVED_INDEX];
