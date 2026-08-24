# Known Limitations

This document records the results of manually running Qadam's full pipeline against
the demo sample documents (`demo/scholarship-sample.jpg`, `demo/government-sample.jpg`)
and additional real-world documents, on the production deployment.

## Testing performed

- Both named demo samples were run through the full pipeline (Upload → Summary →
  Questions → Plan) on the live Vercel deployment.
- An additional real (non-synthetic) document was also tested end-to-end on
  production.
- The "Try an example" feature (pre-baked scholarship and government service data)
  was verified separately to confirm the UI renders correctly independent of any
  live Gemini API call.
- The app was checked on a real mobile device for layout, touch targets, and text
  legibility.

## Findings

No hallucinated or clearly mismatched evidence was observed across the documents
tested. Evidence excerpts shown via "View source" corresponded to text actually
present in the source document in each case checked.

No incorrect eligibility verdicts were observed in testing — verdicts matched
what a manual reading of the document and provided answers would suggest.

## General limitations of the current approach (not bugs, but honest caveats)

- **Evidence is not guaranteed to be a byte-for-byte verbatim quote.** Gemini is
  instructed to preserve evidence exactly, and this held true in all documents
  tested, but as a general property of LLM-based extraction, minor paraphrasing
  is possible on documents not covered by this testing pass. We did not observe
  this in practice, but we do not claim it is structurally impossible.
- **Image clarity affects both accuracy and response latency.** A denser or
  lower-contrast image took noticeably longer to process during testing than a
  clear, high-contrast one, and in one case caused a timeout on the first
  attempt (resolved by retrying with a clearer image). This is a property of the
  underlying model, not the application logic — the 15-second internal timeout
  and clear error messaging are Qadam's mitigation for this.
- **Testing coverage is necessarily limited.** Qadam was tested against a small,
  deliberately chosen set of real Pakistani scholarship and government service
  documents. It has not been tested against the full range of document types,
  layouts, languages, or image qualities a broader user base might upload.
- **English-only output remains a scope limitation**, not a defect — documents
  in Urdu or mixed Urdu/English were not part of this testing round.

## Conclusion

Within the scope of documents tested, Qadam's core trust mechanism — showing
evidence for claims and explicitly marking what cannot be determined rather than
guessing — held up as designed. We are documenting the absence of observed
issues honestly rather than omitting this section, in keeping with the project's
own principle of not overstating certainty.
