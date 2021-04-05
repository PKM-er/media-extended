/**
 * See also: https://www.w3.org/TR/media-frags/#valid-uri
 */
export default {
  tFrag: /(?<start>[\w:\.]*?)(?:,(?<end>[\w:\.]+?))?$/,

  npt_sec: /^\d+(?:\.\d+)?$/,
  npt_mmss: /^(?<mm>[0-5]\d):(?<ss>[0-5]\d(?:\.\d+)?)$/,
  npt_hhmmss: /^(?<hh>\d+):(?<mm>[0-5]\d):(?<ss>[0-5]\d(?:\.\d+)?)$/,
};
