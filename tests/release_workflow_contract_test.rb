#!/usr/bin/env ruby
# frozen_string_literal: true

release = File.read(File.expand_path("../.github/workflows/release.yml", __dir__))
prepare = File.read(File.expand_path("../.github/workflows/prepare-release.yml", __dir__))

required_release_fragments = [
  'test "$GITHUB_REF" = "refs/tags/v${version}"',
  "require('./package.json').version",
  "id-token: write",
  "attestations: write",
  "provenance: mode=max",
  "sbom: true",
  "cosign sign --yes",
  "cosign verify",
  "anchore/sbom-action@",
  "actions/attest-build-provenance@",
  "provenance.jsonl",
  "sha256sum --check",
  "npm audit --omit=dev --audit-level=high",
  "npm-audit.json",
  "npm-audit.json.sigstore.json",
  "fail_on_unmatched_files: true"
]

missing = required_release_fragments.reject { |fragment| release.include?(fragment) }
abort "release workflow is missing: #{missing.join(', ')}" unless missing.empty?

expected_dispatch = 'gh workflow run release.yml --ref "v${version}" -f version="${version}"'
abort "prepare workflow must dispatch the immutable release tag" unless prepare.include?(expected_dispatch)
