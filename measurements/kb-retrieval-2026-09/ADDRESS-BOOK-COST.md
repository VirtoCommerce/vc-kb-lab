# What taking the contract plane out of `ask` cost, measured

2026-09-16, step 2 of the redesign. Reproduce with:

```
node measurements/kb-retrieval-2026-09/replay-questions.mjs --base <a copy of the corpus>
```

## The change

The derived plane left the ranked list. It is reached by **naming a coordinate** now — a route, a
dotted field, or a compound type name in the asker's own spelling — and it still powers the source
door, the cross-plane gate, `kb check` and anchor reachability. Nothing was deleted.

## The cost, against the 34 held-out rows

**Seven rows lost their first-ranked entry. Every one of the seven lost a contract table.**

| row | lost anchor | what it is |
|---|---|---|
| r1.1 | `KB-C0B7076C` | `rest-api-marketing-promotions` |
| r1.3 / r1.4 | `KB-C941FAA3` | `gql-mutations-additem` |
| r2.1 | `KB-746B7535` | `rest-api-order-customerorders` |
| r3.2 | `KB-6FE58084` | `gql-query-organizationorders` |
| r3.3 | `KB-F59E629F` | `gql-mutations-unlockorganizationcontact` |
| r7.3 | `KB-12CEF821` | `gql-type-orderlineitemtype` |

The replay prints **REGRESSION**, and that verdict is correct against a baseline taken on
2026-09-14. It is not re-baselined here. A baseline rewritten the moment it disagrees is an
instrument tuned to agree with its author, and that has already happened once in this project.

## Two of the seven point in opposite directions, and both matter

* **r2.1 is a gain.** `KB-746B7535` is the Admin REST order table that led r3.2 until 2026-09-12,
  where **both blind graders independently** called it off-topic and the wrong surface. It is now
  unreachable by vocabulary. That is the adjacent-answer class going away by construction rather
  than by a tuned floor.
* **r3.2 is a loss.** `KB-6FE58084` — `organizationOrders` — is the entry the graders **wanted**, and
  it is a contract table too. The question that wants it ("how does the storefront decide whether an
  order query returns only my orders or the whole organization's orders") never names the coordinate,
  so coordinate lookup does not reach it either. It would be reached by an asker who typed
  `organizationOrders`, and nobody did.

So the trade is not "we lost only things that were wrong". It is: **the contract plane is
unreachable by paraphrase in both directions.** The review's position — every one of these is a fact
an agent can fetch from the contract itself, authoritatively, in one call — is what makes that
acceptable, and it is a claim about the reader's alternatives rather than about the corpus.

## What it did NOT fix, which is the important part

**Removing the contract plane did not restore the MISS contract.** Measured the same day:

```
ask "sign in to the Admin platform UI"
  -> platform GraphiQL runs as anonymous ...        (written)
     Login on behalf is authorized on the storefront (written)
     admin account Status picker ...                 (written)
```

Three unrelated answers, all of them **written entries**. The second independent review said this
before the change — eight of the nine adjacent answers it counted were written, not derived — and
the sweep's control row still refuses 0 of 3 negatives.

This is worth being plain about: step 2 is justified by utilisation (15% of the plane ever used),
by the addressing role the plane is uniquely good at, and by the class of adjacent answers it does
remove. **It is not justified as a fix for the drift, and it is not one.** The drift is a vocabulary
problem between written entries, and the thing aimed at it is the catalog in context — replacing a
ranking judgement with the reader's, which is the one judge fourteen swept rules could not replace.
