const algebra = require("algebra.js");
var Fraction = algebra.Fraction;
var Expression = algebra.Expression;
var Equation = algebra.Equation;

function cuberoot(x) {
  var y = Math.pow(Math.abs(x), 1 / 3);
  return x < 0 ? -y : y;
}

function solveCubic(a, b, c, d) {
  if (Math.abs(a) < 1e-8) {
    // Quadratic case, ax^2+bx+c=0
    a = b;
    b = c;
    c = d;
    if (Math.abs(a) < 1e-8) {
      // Linear case, ax+b=0
      a = b;
      b = c;
      if (Math.abs(a) < 1e-8)
        // Degenerate case
        return [];
      return [-b / a];
    }

    var D = b * b - 4 * a * c;
    if (Math.abs(D) < 1e-8) return [-b / (2 * a)];
    else if (D > 0)
      return [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)];
    return [];
  }

  // Convert to depressed cubic t^3+pt+q = 0 (subst x = t - b/3a)
  var p = (3 * a * c - b * b) / (3 * a * a);
  var q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
  var roots;

  if (Math.abs(p) < 1e-8) {
    // p = 0 -> t^3 = -q -> t = -q^1/3
    roots = [cuberoot(-q)];
  } else if (Math.abs(q) < 1e-8) {
    // q = 0 -> t^3 + pt = 0 -> t(t^2+p)=0
    roots = [0].concat(p < 0 ? [Math.sqrt(-p), -Math.sqrt(-p)] : []);
  } else {
    var D = (q * q) / 4 + (p * p * p) / 27;
    if (Math.abs(D) < 1e-8) {
      // D = 0 -> two roots
      roots = [(-1.5 * q) / p, (3 * q) / p];
    } else if (D > 0) {
      // Only one real root
      var u = cuberoot(-q / 2 - Math.sqrt(D));
      roots = [u - p / (3 * u)];
    } else {
      // D < 0, three roots, but needs to use complex numbers/trigonometric solution
      var u = 2 * Math.sqrt(-p / 3);
      var t = Math.acos((3 * q) / p / u) / 3; // D < 0 implies p < 0 and acos argument in [-1..1]
      var k = (2 * Math.PI) / 3;
      roots = [u * Math.cos(t), u * Math.cos(t - k), u * Math.cos(t - 2 * k)];
    }
  }

  // Convert back from depressed cubic
  for (var i = 0; i < roots.length; i++) roots[i] -= b / (3 * a);

  return roots;
}

module.exports = {
  name: "math",
  description: "Simplify some math or even solve equations.",
  args: true,
  execute(message, args) {
    const filter = m => m.author.id === message.author.id;
    if (args[0] === "quadratic" || args[0] === "01") {
      message.channel
        .send(
          "Format: Ax² + Bx + C. Please enter A, B and C now. The command will be cancelled after 30 seconds."
        )
        .then(() => {
          message.channel
            .awaitMessages(filter, {
              max: 1,
              time: 30000,
              errors: ["time"]
            })
            .then(collected => {
              var A = parseInt(collected.first().content);
              console.log("A = " + A);
              message.channel.send("Please enter B.").then(() => {
                message.channel
                  .awaitMessages(filter, {
                    max: 1,
                    time: 30000,
                    errors: ["time"]
                  })
                  .then(collected => {
                    var B = parseInt(collected.first().content);
                    console.log("B = " + B);
                    message.channel.send("Please enter C.").then(() => {
                      message.channel
                        .awaitMessages(filter, {
                          max: 1,
                          time: 30000,
                          errors: ["time"]
                        })
                        .then(collected => {
                          var C = parseInt(collected.first().content);
                          console.log("C = " + C);

                          const root1 =
                            (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
                          const root2 =
                            (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A);
                          if (isNaN(root1) || isNaN(root2)) {
                            return message.channel.send(
                              "Failed in calculating."
                            );
                          } else {
                            if (root1 === root2) {
                              message.channel.send(
                                "x = " + root1 + " (repeated)"
                              );
                            } else {
                              message.channel.send(
                                "x = " + root1 + " or " + root2
                              );
                            }
                          }
                        })
                        .catch(() => {
                          message.channel.send(
                            "There was no collected message that passed the filter within the time limit!"
                          );
                        });
                    });
                  })
                  .catch(() => {
                    message.channel.send(
                      "There was no collected message that passed the filter within the time limit!"
                    );
                  });
              });
            })
            .catch(() => {
              message.channel.send(
                "There was no collected message that passed the filter within the time limit!"
              );
            });
        });
    } else if (args[0] === "cubic" || args[0] === "3") {
      message.channel
        .send(
          "Format: Ax³ + Bx² + Cx + D. Please enter A, B, C, D now. The command will be cancelled in 30 seconds."
        )
        .then(() => {
          message.channel
            .awaitMessages(filter, {
              max: 1,
              time: 30000,
              error: ["time"]
            })
            .then(collected => {
              var a = collected.first().content;
              message.channel.send("Please enter B.").then(() => {
                message.channel
                  .awaitMessages(filter, {
                    max: 1,
                    time: 30000,
                    error: ["time"]
                  })
                  .then(collected => {
                    var b = collected.first().content;
                    message.channel.send("Please enter C.").then(() => {
                      message.channel
                        .awaitMessages(filter, {
                          max: 1,
                          time: 30000,
                          error: ["time"]
                        })
                        .then(collected => {
                          var c = collected.first().content;
                          message.channel.send("Please enter D.").then(() => {
                            message.channel
                              .awaitMessages(filter, {
                                max: 1,
                                time: 30000,
                                error: ["time"]
                              })
                              .then(collected => {
                                var d = collected.first().content;
                                const roots = solveCubic(a, b, c, d);
                                if (isNaN(roots)) {
                                  message.channel.send(
                                    "Failed in calculating."
                                  );
                                } else {
                                  message.channel.send(
                                    "x = " + roots.join(" or ")
                                  );
                                }
                              });
                          });
                        })
                        .catch(() => {
                          message.channel.send(
                            "There was no collected message that passed the filter within the time limit!"
                          );
                        });
                    });
                  })
                  .catch(() => {
                    message.channel.send(
                      "There was no collected message that passed the filter within the time limit!"
                    );
                  });
              });
            })
            .catch(() => {
              message.channel.send(
                "There was no collected message that passed the filter within the time limit!"
              );
            });
        });
    } else if (args[0] === "single-variable" || args[0] === "1var") {
      message.channel.send('Please use "x" as the variable in this command.');
      message.channel.send("Enter the L.H.S.").then(() => {
        message.channel
          .awaitMessages(filter, {
            max: 99,
            time: 30000,
            error: ["time"]
          })
          .then(collected => {
            var lhs = algebra.parse(collected.first().content);
            message.channel.send("Enter the R.H.S.").then(() => {
              message.channel
                .awaitMessages(filter, {
                  max: 99,
                  time: 30000,
                  error: ["time"]
                })
                .then(collected => {
                  var rhs = algebra.parse(collected.first().content);
                  var eq = new Equation(lhs, rhs);
                  message.channel.send("Your equation: " + eq.toString());
                  var answer = eq.solveFor("x");
                  message.channel.send("x = " + answer.toString());
                })
                .catch(() => {
                  message.channel.send(
                    "There was no collected message that passed the filter within the time limit!"
                  );
                });
            });
          })
          .catch(() => {
            message.channel.send(
              "There was no collected message that passed the filter within the time limit!"
            );
          });
      });
    }
  }
};
