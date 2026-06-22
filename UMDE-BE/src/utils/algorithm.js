/**
 * Custom Merge Sort Implementation
 * ----------------------------------
 * Problem:   Rank 265 NYC taxi zones by trip volume
 * Approach:  Divide and conquer — split array recursively,
 *            merge back in descending order
 *
 * Pseudo-code:
 *   FUNCTION mergeSort(arr):
 *     IF arr.length <= 1: RETURN arr
 *     mid   = arr.length / 2
 *     left  = mergeSort(arr[0..mid])
 *     right = mergeSort(arr[mid..end])
 *     RETURN merge(left, right)
 *
 *   FUNCTION merge(left, right):
 *     WHILE left and right have elements:
 *       IF left[0] >= right[0]: append left[0]
 *       ELSE: append right[0]
 *     APPEND remaining elements
 *     RETURN result
 *
 * Time Complexity:  O(n log n)
 *   - log n levels of recursion
 *   - n comparisons at each level
 *
 * Space Complexity: O(n)
 *   - new arrays created at each merge step
 */

// Merge two sorted arrays into one sorted array
function merge(left, right, key) {
  const result = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    // Descending order — higher count comes first
    if (left[i][key] >= right[j][key]) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  // Append remaining elements
  while (i < left.length) {
    result.push(left[i]);
    i++;
  }
  while (j < right.length) {
    result.push(right[j]);
    j++;
  }

  return result;
}

// Recursively split and merge
function mergeSort(arr, key) {
  // Base case — single element is already sorted
  if (arr.length <= 1) return arr;

  // Split array in half
  const mid   = Math.floor(arr.length / 2);
  const left  = mergeSort(arr.slice(0, mid), key);
  const right = mergeSort(arr.slice(mid), key);

  return merge(left, right, key);
}

/**
 * Rank zones by trip count using custom merge sort
 * @param {Array} zones - array of zone objects with trip_count
 * @param {number} topN  - how many top zones to return
 * @returns {Array} sorted zones
 */
function rankZonesByTripCount(zones, topN = 10) {
  // Convert trip_count to integer first
  const parsed = zones.map(z => ({
    ...z,
    trip_count: parseInt(z.trip_count)
  }));

  const sorted = mergeSort(parsed, 'trip_count');
  return sorted.slice(0, topN);
}

module.exports = { rankZonesByTripCount, mergeSort };