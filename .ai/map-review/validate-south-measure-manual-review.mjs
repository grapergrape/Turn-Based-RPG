import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_MAPS = 9;
const EXPECTED_CRITERIA_PER_MAP = 20;
const EXPECTED_PASSES_PER_CRITERION = 10;
const EXPECTED_RECORDS_PER_MAP = 200;
const EXPECTED_RECORDS = 1800;
const PASS_OFFSETS = Object.freeze([0, 20, 40, 60, 80, 100, 120, 140, 160, 180]);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceDir = path.join(repoRoot, '.ai/visual-audit/ash-road-south-200-passes');
const reportPath = path.join(evidenceDir, 'report.json');
const manifestPath = path.join(evidenceDir, 'manifest.json');
const reviewPath = path.join(evidenceDir, 'manual-review.json');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(filePath, label) {
  let source;
  try {
    source = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`${label} is missing or unreadable at ${path.relative(repoRoot, filePath)}: ${error.message}`);
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function requireExactUniqueEntries(entries, count, key, label) {
  invariant(Array.isArray(entries), `${label} must be an array`);
  invariant(entries.length === count, `${label} has ${entries.length} entries; expected ${count}`);
  const values = entries.map((entry) => entry?.[key]);
  invariant(values.every((value) => typeof value === 'string' && value.trim()), `${label} contains a missing ${key}`);
  invariant(new Set(values).size === count, `${label} contains duplicate ${key} values`);
  return new Map(entries.map((entry) => [entry[key], entry]));
}

function expectedPassNumbers(ordinal) {
  return PASS_OFFSETS.map((offset) => ordinal + offset);
}

function requirePassNumbers(actual, expected, label) {
  invariant(Array.isArray(actual), `${label}.passNumbers must be an array`);
  invariant(actual.length === EXPECTED_PASSES_PER_CRITERION, `${label}.passNumbers has ${actual.length} entries; expected 10`);
  invariant(actual.every(Number.isInteger), `${label}.passNumbers must contain only integers`);
  invariant(new Set(actual).size === actual.length, `${label}.passNumbers contains duplicates`);
  invariant(
    actual.every((passNumber, index) => passNumber === expected[index]),
    `${label}.passNumbers must be exactly [${expected.join(', ')}]`
  );
}

function requireReviewFields(review, label) {
  invariant(review.outcome === 'PASS', `${label}.outcome must be PASS`);
  for (const field of ['finding', 'reviewer', 'reviewedAt']) {
    invariant(typeof review[field] === 'string' && review[field].trim(), `${label}.${field} must be a nonempty string`);
  }
  invariant(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(review.reviewedAt)
      && Number.isFinite(Date.parse(review.reviewedAt)),
    `${label}.reviewedAt must be an ISO 8601 date-time`
  );
}

function requireCompleteReport(report) {
  invariant(report?.schema === 'ash-road-south-visual-pass-report', 'report.json has the wrong schema');
  invariant(report.certifying === true, 'report.json is not certifying');
  invariant(report.status === 'complete-and-validated', 'report.json is not complete-and-validated');
  invariant(report.expected?.maps === EXPECTED_MAPS, 'report.json does not require exactly 9 maps');
  invariant(report.expected?.passesPerMap === EXPECTED_RECORDS_PER_MAP, 'report.json does not require exactly 200 passes per map');
  invariant(report.expected?.totalPasses === EXPECTED_RECORDS, 'report.json does not require exactly 1,800 passes');
  invariant(report.expected?.criteriaPerMap === EXPECTED_CRITERIA_PER_MAP, 'report.json does not require exactly 20 criteria per map');
  invariant(report.expected?.recordsPerCriterion === EXPECTED_PASSES_PER_CRITERION, 'report.json does not require exactly 10 records per criterion');
  invariant(report.actual?.mapsCaptured === EXPECTED_MAPS, 'report.json did not capture all 9 maps');
  invariant(report.actual?.recordsCaptured === EXPECTED_RECORDS, 'report.json did not capture all 1,800 records');
  invariant(report.actual?.uniqueViews === EXPECTED_RECORDS, 'report.json does not prove 1,800 unique views');
  invariant(report.actual?.uniqueScreenshotHashes === EXPECTED_RECORDS, 'report.json does not prove 1,800 unique screenshots');
  invariant(report.actual?.uniqueScreenshotPaths === EXPECTED_RECORDS, 'report.json does not prove 1,800 unique screenshot paths');
  invariant(Array.isArray(report.checks) && report.checks.length > 0 && report.checks.every((check) => check?.passed === true), 'report.json contains a failed or missing validation check');
  return requireExactUniqueEntries(report.maps, EXPECTED_MAPS, 'mapId', 'report.json maps');
}

function requireCompleteManifest(manifest) {
  invariant(manifest?.schema === 'ash-road-south-visual-pass-manifest', 'manifest.json has the wrong schema');
  invariant(manifest.certifying === true, 'manifest.json is not certifying');
  invariant(manifest.status === 'complete-and-validated', 'manifest.json is not complete-and-validated');
  invariant(manifest.contract?.maps === EXPECTED_MAPS, 'manifest.json does not require exactly 9 maps');
  invariant(manifest.contract?.passesPerMap === EXPECTED_RECORDS_PER_MAP, 'manifest.json does not require exactly 200 passes per map');
  invariant(manifest.contract?.totalPasses === EXPECTED_RECORDS, 'manifest.json does not require exactly 1,800 passes');
  invariant(manifest.contract?.criteriaPerMap === EXPECTED_CRITERIA_PER_MAP, 'manifest.json does not require exactly 20 criteria per map');
  invariant(manifest.contract?.recordsPerCriterion === EXPECTED_PASSES_PER_CRITERION, 'manifest.json does not require exactly 10 records per criterion');
  return requireExactUniqueEntries(manifest.maps, EXPECTED_MAPS, 'mapId', 'manifest.json maps');
}

function requireReviewLedger(review) {
  invariant(review?.schema === 'ash-road-south-manual-review', 'manual-review.json has the wrong schema');
  invariant(review.schemaVersion === 1, 'manual-review.json has an unsupported schemaVersion');
  return requireExactUniqueEntries(review.maps, EXPECTED_MAPS, 'mapId', 'manual-review.json maps');
}

function resolveEvidencePath(relativePath, label) {
  invariant(typeof relativePath === 'string' && relativePath.trim(), `${label} is missing its screenshot path`);
  invariant(!path.isAbsolute(relativePath), `${label} screenshot path must be relative`);
  const resolved = path.resolve(evidenceDir, relativePath);
  invariant(resolved.startsWith(`${evidenceDir}${path.sep}`), `${label} screenshot path escapes the evidence directory`);
  return resolved;
}

async function requireScreenshot(record, label) {
  const screenshotPath = resolveEvidencePath(record?.screenshot?.path, label);
  let screenshotStat;
  try {
    screenshotStat = await stat(screenshotPath);
  } catch (error) {
    throw new Error(`${label} screenshot is missing: ${record.screenshot.path} (${error.message})`);
  }
  invariant(screenshotStat.isFile() && screenshotStat.size > 0, `${label} screenshot is not a nonempty file: ${record.screenshot.path}`);
}

const [report, manifest, review] = await Promise.all([
  readJson(reportPath, 'capture report'),
  readJson(manifestPath, 'capture manifest'),
  readJson(reviewPath, 'manual review ledger')
]);

const reportMaps = requireCompleteReport(report);
const manifestMaps = requireCompleteManifest(manifest);
const reviewMaps = requireReviewLedger(review);
const reviewedRecords = new Set();

for (const [mapId, manifestMap] of manifestMaps) {
  const mapLabel = `map ${mapId}`;
  const reportMap = reportMaps.get(mapId);
  const reviewMap = reviewMaps.get(mapId);
  invariant(reportMap, `${mapLabel} is missing from report.json`);
  invariant(reviewMap, `${mapLabel} is missing from manual-review.json`);
  invariant(reportMap.records === EXPECTED_RECORDS_PER_MAP, `${mapLabel} report summary does not contain 200 records`);
  invariant(Array.isArray(manifestMap.records) && manifestMap.records.length === EXPECTED_RECORDS_PER_MAP, `${mapLabel} manifest does not contain 200 records`);

  const recordsByPass = new Map();
  for (const record of manifestMap.records) {
    invariant(Number.isInteger(record?.passNumber), `${mapLabel} contains a record without an integer passNumber`);
    invariant(!recordsByPass.has(record.passNumber), `${mapLabel} contains duplicate pass ${record.passNumber}`);
    recordsByPass.set(record.passNumber, record);
  }
  invariant(recordsByPass.size === EXPECTED_RECORDS_PER_MAP, `${mapLabel} does not contain 200 unique pass numbers`);

  const manifestCriteria = requireExactUniqueEntries(
    manifestMap.criteria,
    EXPECTED_CRITERIA_PER_MAP,
    'id',
    `${mapLabel} manifest criteria`
  );
  const reviewCriteria = requireExactUniqueEntries(
    reviewMap.criteria,
    EXPECTED_CRITERIA_PER_MAP,
    'criterionId',
    `${mapLabel} review criteria`
  );

  for (const [criterionIndex, criterion] of manifestMap.criteria.entries()) {
    const ordinal = criterionIndex + 1;
    const criterionId = criterion.id;
    const criterionLabel = `${mapLabel} criterion ${criterionId}`;
    invariant(manifestCriteria.has(criterionId), `${criterionLabel} is missing from manifest.json`);
    const criterionReview = reviewCriteria.get(criterionId);
    invariant(criterionReview, `${criterionLabel} is missing from manual-review.json`);
    requireReviewFields(criterionReview, criterionLabel);
    const passNumbers = expectedPassNumbers(ordinal);
    requirePassNumbers(criterionReview.passNumbers, passNumbers, criterionLabel);

    for (const passNumber of passNumbers) {
      const record = recordsByPass.get(passNumber);
      const recordLabel = `${criterionLabel} pass ${passNumber}`;
      invariant(record, `${recordLabel} is missing from manifest.json`);
      invariant(record.mapId === mapId, `${recordLabel} references the wrong map`);
      invariant(record.criterion?.id === criterionId, `${recordLabel} references criterion ${record.criterion?.id ?? 'none'}`);
      invariant(!reviewedRecords.has(`${mapId}:${passNumber}`), `${recordLabel} is reviewed more than once`);
      await requireScreenshot(record, recordLabel);
      reviewedRecords.add(`${mapId}:${passNumber}`);
    }
  }
}

invariant(reviewedRecords.size === EXPECTED_RECORDS, `manual review covers ${reviewedRecords.size} screenshot records; expected 1,800`);
console.log(`manual review validated: 9 maps, 180 PASS criteria, 1,800 screenshot records`);
