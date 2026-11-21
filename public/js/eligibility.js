/**
 * SchemeSaathi AI - Eligibility & Recommendation Engine
 * Calculates multi-factor match score based on citizen profile
 */

class EligibilityEngine {
  static evaluate(profile, schemes) {
    if (!profile || !schemes) return [];

    return schemes.map(scheme => {
      let score = 0;
      let criteria = scheme.criteria || [];
      let met = [];

      if (criteria.length === 0) {
        score = 80; // Baseline
      } else {
        criteria.forEach(c => {
          let passed = false;
          if (typeof c[1] === 'function') {
            try { passed = Boolean(c[1](profile)); } catch (e) { passed = false; }
          } else if (c.rule) {
            if (c.rule === 'cat') passed = !c.values || c.values.includes(profile.cat);
            if (c.rule === 'area') passed = !c.values || c.values.includes(profile.area);
            if (c.rule === 'occ') passed = !c.values || c.values.includes(profile.occ);
            if (c.rule === 'gender') passed = !c.values || c.values.includes(profile.gender);
            if (c.rule === 'income') passed = !profile.inc || profile.inc <= c.max;
            if (c.rule === 'bpl') passed = Boolean(profile.bpl);
          }

          if (passed) {
            score += (100 / criteria.length);
            met.push(c[0] || c.label);
          }
        });
      }

      const finalScore = Math.min(100, Math.round(score));
      return {
        ...scheme,
        matchScore: finalScore,
        matchGrade: finalScore >= 80 ? 'High' : (finalScore >= 50 ? 'Medium' : 'Low'),
        metCriteria: met
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  static filterByStatus(schemes, filterType) {
    if (filterType === 'ongoing') {
      return schemes.filter(s => s.status !== 'expired');
    }
    if (filterType === 'expired') {
      return schemes.filter(s => s.status === 'expired');
    }
    return schemes; // 'all'
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EligibilityEngine;
}
