module.exports = {
  smoothstep: function (a, b, t) {
    var c = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return c * c * (3 - 2 * c);
  },

  smootherstep: function (a, b, t) {
    var c = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return c * c * c * (c * (c * 6 - 15) + 10);
  },

  bezier: function (a, b, c, t) {
    var c = (a * t * t) + (b * 2 * t * (1 - t)) + (c * (1 - t) * (1 - t));
    return c;
  }
}