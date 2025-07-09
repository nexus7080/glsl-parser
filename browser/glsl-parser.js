var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// dist/ast/ast.js
var makeGenerator = function(generators3) {
  var gen = function(ast) {
    return typeof ast === "string" ? ast : ast === null || ast === void 0 ? "" : Array.isArray(ast) ? ast.map(gen).join("") : ast.type in generators3 ? generators3[ast.type](ast) : "NO GENERATOR FOR ".concat(ast.type) + ast;
  };
  return gen;
};
var makeEveryOtherGenerator = function(generate3) {
  var everyOther = function(nodes, eo) {
    return nodes.reduce(function(output, node, index) {
      return output + generate3(node) + (index === nodes.length - 1 ? "" : generate3(eo[index]));
    }, "");
  };
  return everyOther;
};

// dist/ast/visit.js
var isNode = function(node) {
  return !!(node === null || node === void 0 ? void 0 : node.type);
};
var isTraversable = function(node) {
  return isNode(node) || Array.isArray(node);
};
var makePath = function(node, parent, parentPath, key, index) {
  return {
    node,
    parent,
    parentPath,
    key,
    index,
    stop: function() {
      this.stopped = true;
    },
    skip: function() {
      this.skipped = true;
    },
    remove: function() {
      this.removed = true;
    },
    replaceWith: function(replacer) {
      this.replaced = replacer;
    },
    findParent: function(test) {
      return !parentPath ? parentPath : test(parentPath) ? parentPath : parentPath.findParent(test);
    }
  };
};
var visit = function(ast, visitors) {
  var stopped = false;
  var visitNode = function(node, parent, parentPath, key, index) {
    var _a;
    if (stopped) {
      return;
    }
    var visitor = visitors[node.type];
    var path = makePath(node, parent, parentPath, key, index);
    var parentNode = parent;
    if (visitor === null || visitor === void 0 ? void 0 : visitor.enter) {
      visitor.enter(path);
      if (path.removed) {
        if (!key || !parent) {
          throw new Error("Asked to remove ".concat(node, " but no parent key was present in ").concat(parent));
        }
        if (typeof index === "number") {
          parentNode[key].splice(index, 1);
        } else {
          parentNode[key] = null;
        }
        return path;
      }
      if (path.replaced) {
        if (!key || !parent) {
          throw new Error("Asked to remove ".concat(node, " but no parent key was present in ").concat(parent));
        }
        if (typeof index === "number") {
          parentNode[key].splice(index, 1, path.replaced);
        } else {
          parentNode[key] = path.replaced;
        }
      }
      if (path.skipped) {
        return path;
      }
    }
    if (path.stopped) {
      stopped = true;
      return;
    }
    if (path.replaced) {
      var replacedNode = path.replaced;
      visitNode(replacedNode, parent, parentPath, key, index);
    } else {
      Object.entries(node).filter(function(_a2) {
        var _ = _a2[0], nodeValue = _a2[1];
        return isTraversable(nodeValue);
      }).forEach(function(_a2) {
        var nodeKey = _a2[0], nodeValue = _a2[1];
        if (Array.isArray(nodeValue)) {
          for (var i = 0, offset = 0; i - offset < nodeValue.length && !stopped; i++) {
            var child = nodeValue[i - offset];
            var res = visitNode(child, node, path, nodeKey, i - offset);
            if (res === null || res === void 0 ? void 0 : res.removed) {
              offset += 1;
            }
          }
        } else {
          if (!stopped) {
            visitNode(nodeValue, node, path, nodeKey);
          }
        }
      });
      if (!stopped) {
        (_a = visitor === null || visitor === void 0 ? void 0 : visitor.exit) === null || _a === void 0 ? void 0 : _a.call(visitor, path);
      }
    }
  };
  visitNode(ast);
};

// dist/parser/generator.js
var generators = {
  program: function(node) {
    return generate(node.wsStart) + generate(node.program);
  },
  preprocessor: function(node) {
    return generate(node.line) + generate(node._);
  },
  keyword: function(node) {
    return generate(node.token) + generate(node.whitespace);
  },
  precision: function(node) {
    return generate(node.prefix) + generate(node.qualifier) + generate(node.specifier);
  },
  // Statements
  expression_statement: function(node) {
    return generate(node.expression) + generate(node.semi);
  },
  if_statement: function(node) {
    return generate(node.if) + generate(node.lp) + generate(node.condition) + generate(node.rp) + generate(node.body) + generate(node.else);
  },
  switch_statement: function(node) {
    return generate(node.switch) + generate(node.lp) + generate(node.expression) + generate(node.rp) + generate(node.lb) + generate(node.cases) + generate(node.rb);
  },
  break_statement: function(node) {
    return generate(node.break) + generate(node.semi);
  },
  do_statement: function(node) {
    return generate(node.do) + generate(node.body) + generate(node.while) + generate(node.lp) + generate(node.expression) + generate(node.rp) + generate(node.semi);
  },
  continue_statement: function(node) {
    return generate(node.continue) + generate(node.semi);
  },
  return_statement: function(node) {
    return generate(node.return) + generate(node.expression) + generate(node.semi);
  },
  discard_statement: function(node) {
    return generate(node.discard) + generate(node.semi);
  },
  while_statement: function(node) {
    return generate(node.while) + generate(node.lp) + generate(node.condition) + generate(node.rp) + generate(node.body);
  },
  for_statement: function(node) {
    return generate(node.for) + generate(node.lp) + generate(node.init) + generate(node.initSemi) + generate(node.condition) + generate(node.conditionSemi) + generate(node.operation) + generate(node.rp) + generate(node.body);
  },
  condition_expression: function(node) {
    return generate(node.specified_type) + generate(node.identifier) + generate(node.operator) + generate(node.initializer);
  },
  declaration_statement: function(node) {
    return generate(node.declaration) + generate(node.semi);
  },
  fully_specified_type: function(node) {
    return generate(node.qualifiers) + generate(node.specifier);
  },
  layout_qualifier: function(node) {
    return generate(node.layout) + generate(node.lp) + generateWithEveryOther(node.qualifiers, node.commas) + generate(node.rp);
  },
  layout_qualifier_id: function(node) {
    return generate(node.identifier) + generate(node.operator) + generate(node.expression);
  },
  switch_case: function(node) {
    return generate(node.case) + generate(node.test) + generate(node.colon) + generate(node.statements);
  },
  default_case: function(node) {
    return generate(node.default) + generate(node.colon) + generate(node.statements);
  },
  declaration: function(node) {
    return generate(node.identifier) + generate(node.quantifier) + generate(node.equal) + generate(node.initializer);
  },
  declarator_list: function(node) {
    return generate(node.specified_type) + generateWithEveryOther(node.declarations, node.commas);
  },
  type_specifier: function(node) {
    return generate(node.specifier) + generate(node.quantifier);
  },
  array_specifier: function(node) {
    return generate(node.lb) + generate(node.expression) + generate(node.rb);
  },
  identifier: function(node) {
    return node.identifier + generate(node.whitespace);
  },
  type_name: function(node) {
    return node.identifier + generate(node.whitespace);
  },
  function_header: function(node) {
    return generate(node.returnType) + generate(node.name) + generate(node.lp);
  },
  function_prototype: function(node) {
    return generate(node.header.returnType) + generate(node.header.name) + generate(node.header.lp) + (node.parameters ? generateWithEveryOther(node.parameters, node.commas) : "") + generate(node.rp);
  },
  parameter_declaration: function(node) {
    return generate(node.qualifier) + generate(node.specifier) + generate(node.identifier) + generate(node.quantifier);
  },
  compound_statement: function(node) {
    return generate(node.lb) + generate(node.statements) + generate(node.rb);
  },
  function: function(node) {
    return generate(node["prototype"]) + generate(node.body);
  },
  function_call: function(node) {
    return generate(node.identifier) + generate(node.lp) + generate(node.args) + generate(node.rp);
  },
  postfix: function(node) {
    return generate(node.expression) + generate(node.postfix);
  },
  quantifier: function(node) {
    return generate(node.lb) + generate(node.expression) + generate(node.rb);
  },
  quantified_identifier: function(node) {
    return generate(node.identifier) + generate(node.quantifier);
  },
  field_selection: function(node) {
    return generate(node.dot) + generate(node.selection);
  },
  subroutine_qualifier: function(node) {
    return generate(node.subroutine) + generate(node.lp) + generate(node.type_names) + generate(node.commas) + generate(node.rp);
  },
  assignment: function(node) {
    return generate(node.left) + generate(node.operator) + generate(node.right);
  },
  ternary: function(node) {
    return generate(node.expression) + generate(node.question) + generate(node.left) + generate(node.colon) + generate(node.right);
  },
  binary: function(node) {
    return generate(node.left) + generate(node.operator) + generate(node.right);
  },
  group: function(node) {
    return generate(node.lp) + generate(node.expression) + generate(node.rp);
  },
  unary: function(node) {
    return generate(node.operator) + generate(node.expression);
  },
  float_constant: function(node) {
    return generate(node.token) + generate(node.whitespace);
  },
  double_constant: function(node) {
    return generate(node.token) + generate(node.whitespace);
  },
  int_constant: function(node) {
    return generate(node.token) + generate(node.whitespace);
  },
  uint_constant: function(node) {
    return generate(node.token) + generate(node.whitespace);
  },
  bool_constant: function(node) {
    return generate(node.token) + generate(node.whitespace);
  },
  literal: function(node) {
    return generate(node.literal) + generate(node.whitespace);
  },
  struct: function(node) {
    return generate(node.struct) + generate(node.typeName) + generate(node.lb) + generate(node.declarations) + generate(node.rb);
  },
  struct_declaration: function(node) {
    return generate(node.declaration) + generate(node.semi);
  },
  interface_declarator: function(node) {
    return generate(node.qualifiers) + generate(node.interface_type) + generate(node.lp) + generate(node.declarations) + generate(node.rp) + generate(node.identifier);
  },
  struct_declarator: function(node) {
    return generate(node.specified_type) + generateWithEveryOther(node.declarations, node.commas);
  },
  initializer_list: function(node) {
    return generate(node.lb) + generateWithEveryOther(node.initializers, node.commas) + generate(node.rb);
  },
  qualifier_declarator: function(node) {
    return generate(node.qualifiers) + generateWithEveryOther(node.declarations, node.commas);
  }
};
var generate = makeGenerator(generators);
var generateWithEveryOther = makeEveryOtherGenerator(generate);
var generator_default = generate;

// dist/parser/parser.js
var parser_exports = {};
__export(parser_exports, {
  SyntaxError: () => peg$SyntaxError,
  parse: () => peg$parse
});

// dist/parser/utils.js
var xor = function(a, b) {
  return (a || b) && !(a && b);
};

// dist/parser/scope.js
var __spreadArray = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var UNKNOWN_TYPE = "UNKNOWN TYPE";
var makeScopeIndex = function(firstReference, declaration) {
  return {
    declaration,
    references: [firstReference]
  };
};
var findTypeScope = function(scope, typeName) {
  if (!scope) {
    return null;
  }
  if (typeName in scope.types) {
    return scope;
  }
  return findTypeScope(scope.parent, typeName);
};
var isDeclaredType = function(scope, typeName) {
  return findTypeScope(scope, typeName) !== null;
};
var findBindingScope = function(scope, name) {
  if (!scope) {
    return null;
  }
  if (name in scope.bindings) {
    return scope;
  }
  return findBindingScope(scope.parent, name);
};
var extractConstant = function(expression) {
  var result = UNKNOWN_TYPE;
  if ("token" in expression) {
    result = expression.token;
  } else if ("identifier" in expression && typeof expression.identifier === "string") {
    result = expression.identifier;
  } else {
    console.warn(result, expression);
  }
  return result;
};
var quantifiersSignature = function(quantifier) {
  return quantifier.map(function(q) {
    return "[".concat(extractConstant(q.expression), "]");
  }).join("");
};
var functionDeclarationSignature = function(node) {
  var _a;
  var proto = node.type === "function" ? node.prototype : node;
  var specifier = proto.header.returnType.specifier;
  var quantifiers = specifier.quantifier || [];
  var parameterTypes = ((_a = proto === null || proto === void 0 ? void 0 : proto.parameters) === null || _a === void 0 ? void 0 : _a.map(function(_a2) {
    var specifier2 = _a2.specifier, quantifier = _a2.quantifier;
    var quantifiers2 = (
      // vec4[1][2] param
      specifier2.quantifier || // vec4 param[1][3]
      quantifier || []
    );
    return "".concat(extractConstant(specifier2.specifier)).concat(quantifiersSignature(quantifiers2));
  })) || ["void"];
  var returnType = "".concat(specifier.specifier.token).concat(quantifiersSignature(quantifiers));
  return [
    returnType,
    parameterTypes,
    "".concat(returnType, ": ").concat(parameterTypes.join(", "))
  ];
};
var doSignaturesMatch = function(definitionSignature, definition, callSignature) {
  if (definitionSignature === callSignature[0]) {
    return true;
  }
  var left = __spreadArray([definition.returnType], definition.parameterTypes, true);
  var right = __spreadArray([callSignature[0]], callSignature[1], true);
  if (left.length === 2 && xor(left[1] === "void", right[1] === "void")) {
    return false;
  }
  return left.length === right.length && left.every(function(type, index) {
    return type === right[index] || type === UNKNOWN_TYPE || right[index] === UNKNOWN_TYPE;
  });
};
var findOverloadDefinition = function(signature, index) {
  return Object.entries(index).reduce(function(found, _a) {
    var overloadSignature = _a[0], overloadDefinition = _a[1];
    return found || (doSignaturesMatch(overloadSignature, overloadDefinition, signature) ? overloadDefinition : void 0);
  }, void 0);
};
var functionUseSignature = function(node) {
  var parameterTypes = node.args.length === 0 ? ["void"] : node.args.filter(function(arg) {
    return arg.literal !== ",";
  }).map(function() {
    return UNKNOWN_TYPE;
  });
  var returnType = UNKNOWN_TYPE;
  return [
    returnType,
    parameterTypes,
    "".concat(returnType, ": ").concat(parameterTypes.join(", "))
  ];
};
var newOverloadIndex = function(returnType, parameterTypes, firstReference, declaration) {
  return {
    returnType,
    parameterTypes,
    declaration,
    references: [firstReference]
  };
};
var findGlobalScope = function(scope) {
  return scope.parent ? findGlobalScope(scope.parent) : scope;
};
var isDeclaredFunction = function(scope, fnName) {
  return fnName in findGlobalScope(scope).functions;
};

// dist/parser/grammar.js
var __assign = function() {
  __assign = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __spreadArray2 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var partial = function(typeNameOrAttrs, attrs) {
  return {
    partial: attrs === void 0 ? typeNameOrAttrs : __assign({ type: typeNameOrAttrs }, attrs)
  };
};
var xnil = function() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  return args.flat().filter(function(e) {
    return e !== void 0 && e !== null && e !== "" && e.length !== 0;
  });
};
var ifOnly = function(arr) {
  return arr.length > 1 ? arr : arr[0];
};
var collapse = function() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  return ifOnly(xnil(args));
};
var leftAssociate = function(head) {
  var tail = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    tail[_i - 1] = arguments[_i];
  }
  return tail.flat().reduce(function(left, _a) {
    var operator = _a[0], right = _a[1];
    return {
      type: "binary",
      operator,
      left,
      right
    };
  }, head);
};
var BUILT_INS = {
  vertex: /* @__PURE__ */ new Set([
    "gl_VertexID",
    "gl_InstanceID",
    "gl_DrawID",
    "gl_BaseVertex",
    "gl_BaseInstance",
    "gl_Position",
    "gl_PointSize",
    "gl_ClipDistance"
  ]),
  fragment: /* @__PURE__ */ new Set([
    "gl_FragColor",
    "gl_FragData",
    "gl_FragCoord",
    "gl_FrontFacing",
    "gl_PointCoord",
    "gl_SampleID",
    "gl_SamplePosition",
    "gl_SampleMaskIn",
    "gl_ClipDistance",
    "gl_PrimitiveID",
    "gl_Layer",
    "gl_ViewportIndex",
    "gl_FragDepth",
    "gl_SampleMask"
  ])
};
var FN_BUILT_INS = /* @__PURE__ */ new Set([
  "abs",
  "acos",
  "acosh",
  "all",
  "any",
  "asin",
  "asinh",
  "atan",
  "atanh",
  "atomicAdd",
  "atomicAnd",
  "atomicCompSwap",
  "atomicCounter",
  "atomicCounterDecrement",
  "atomicCounterIncrement",
  "atomicExchange",
  "atomicMax",
  "atomicMin",
  "atomicOr",
  "atomicXor",
  "barrier",
  "bitCount",
  "bitfieldExtract",
  "bitfieldInsert",
  "bitfieldReverse",
  "ceil",
  "clamp",
  "cos",
  "cosh",
  "cross",
  "degrees",
  "determinant",
  "dFdx",
  "dFdxCoarse",
  "dFdxFine",
  "dFdy",
  "dFdyCoarse",
  "dFdyFine",
  "distance",
  "dot",
  "EmitStreamVertex",
  "EmitVertex",
  "EndPrimitive",
  "EndStreamPrimitive",
  "equal",
  "exp",
  "exp2",
  "faceforward",
  "findLSB",
  "findMSB",
  "floatBitsToInt",
  "floatBitsToUint",
  "floor",
  "fma",
  "fract",
  "frexp",
  "fwidth",
  "fwidthCoarse",
  "fwidthFine",
  "greaterThan",
  "greaterThanEqual",
  "groupMemoryBarrier",
  "imageAtomicAdd",
  "imageAtomicAnd",
  "imageAtomicCompSwap",
  "imageAtomicExchange",
  "imageAtomicMax",
  "imageAtomicMin",
  "imageAtomicOr",
  "imageAtomicXor",
  "imageLoad",
  "imageSamples",
  "imageSize",
  "imageStore",
  "imulExtended",
  "intBitsToFloat",
  "interpolateAtCentroid",
  "interpolateAtOffset",
  "interpolateAtSample",
  "inverse",
  "inversesqrt",
  "isinf",
  "isnan",
  "ldexp",
  "length",
  "lessThan",
  "lessThanEqual",
  "log",
  "log2",
  "matrixCompMult",
  "max",
  "memoryBarrier",
  "memoryBarrierAtomicCounter",
  "memoryBarrierBuffer",
  "memoryBarrierImage",
  "memoryBarrierShared",
  "min",
  "mix",
  "mod",
  "modf",
  "noise",
  "noise1",
  "noise2",
  "noise3",
  "noise4",
  "normalize",
  "not",
  "notEqual",
  "outerProduct",
  "packDouble2x32",
  "packHalf2x16",
  "packSnorm2x16",
  "packSnorm4x8",
  "packUnorm",
  "packUnorm2x16",
  "packUnorm4x8",
  "pow",
  "radians",
  "reflect",
  "refract",
  "round",
  "roundEven",
  "sign",
  "sin",
  "sinh",
  "smoothstep",
  "sqrt",
  "step",
  "tan",
  "tanh",
  "texelFetch",
  "texelFetchOffset",
  "texture",
  "textureGather",
  "textureGatherOffset",
  "textureGatherOffsets",
  "textureGrad",
  "textureGradOffset",
  "textureLod",
  "textureLodOffset",
  "textureOffset",
  "textureProj",
  "textureProjGrad",
  "textureProjGradOffset",
  "textureProjLod",
  "textureProjLodOffset",
  "textureProjOffset",
  "textureQueryLevels",
  "textureQueryLod",
  "textureSamples",
  "textureSize",
  "transpose",
  "trunc",
  "uaddCarry",
  "uintBitsToFloat",
  "umulExtended",
  "unpackDouble2x32",
  "unpackHalf2x16",
  "unpackSnorm2x16",
  "unpackSnorm4x8",
  "unpackUnorm",
  "unpackUnorm2x16",
  "unpackUnorm4x8",
  "usubBorrow",
  // GLSL ES 1.00
  "texture2D",
  "textureCube"
]);
var makeLocals = function(context) {
  var getLocation = function(loc) {
    if (!context.options.includeLocation) {
      return;
    }
    var _a = loc || context.location(), start = _a.start, end = _a.end;
    return { start, end };
  };
  var node = function(type, attrs) {
    var n = __assign({ type }, attrs);
    if (context.options.includeLocation) {
      n.location = getLocation();
    }
    return n;
  };
  var makeScope = function(name, parent, startLocation) {
    var newLocation = getLocation(startLocation);
    return __assign(__assign({ name, parent }, newLocation ? { location: newLocation } : false), { bindings: {}, types: {}, functions: {} });
  };
  var warn = function(message) {
    if (context.options.failOnWarn) {
      throw new Error(message);
    }
    if (!context.options.quiet) {
      console.warn(message);
    }
  };
  var pushScope = function(scope) {
    context.scopes.push(scope);
    return scope;
  };
  var popScope = function(scope) {
    if (!scope.parent) {
      throw new Error("Popped bad scope ".concat(scope, " at ").concat(context.text()));
    }
    return scope.parent;
  };
  var setScopeEnd = function(scope, end) {
    if (context.options.includeLocation) {
      if (!scope.location) {
        console.error("No end location at ".concat(context.text()));
      } else {
        scope.location.end = end;
      }
    }
  };
  var addFunctionCallReference = function(scope, name, fnRef) {
    var _a;
    var global = findGlobalScope(scope);
    var signature = functionUseSignature(fnRef);
    if (!global.functions[name]) {
      warn('Encountered undeclared function: "'.concat(name, '" with signature "').concat(signature[2], '"'));
      global.functions[name] = (_a = {}, _a[signature[2]] = newOverloadIndex(signature[0], signature[1], fnRef), _a);
    } else {
      var existingOverload = findOverloadDefinition(signature, global.functions[name]);
      if (!existingOverload) {
        warn('No matching overload for function: "'.concat(name, '" with signature "').concat(signature[2], '"'));
        global.functions[name][signature[2]] = newOverloadIndex(signature[0], signature[1], fnRef);
      } else {
        existingOverload.references.push(fnRef);
      }
    }
  };
  var createFunctionDefinition = function(scope, name, fnRef) {
    var global = findGlobalScope(scope);
    var signature = functionDeclarationSignature(fnRef);
    if (!global.functions[name]) {
      global.functions[name] = {};
    }
    var existing = global.functions[name][signature[2]];
    if (existing) {
      if (existing.declaration) {
        warn('Encountered duplicate function definition: "'.concat(name, '" with signature "').concat(signature[2], '"'));
      } else {
        existing.declaration = fnRef;
      }
      existing.references.push(fnRef);
    } else {
      global.functions[name][signature[2]] = newOverloadIndex(signature[0], signature[1], fnRef);
      global.functions[name][signature[2]].declaration = fnRef;
    }
  };
  var createFunctionPrototype = function(scope, name, fnRef) {
    var global = findGlobalScope(scope);
    var signature = functionDeclarationSignature(fnRef);
    if (!global.functions[name]) {
      global.functions[name] = {};
    }
    var existing = global.functions[name][signature[2]];
    if (existing) {
      warn('Encountered duplicate function prototype: "'.concat(name, '" with signature "').concat(signature[2], '"'));
      existing.references.push(fnRef);
    } else {
      global.functions[name][signature[2]] = newOverloadIndex(signature[0], signature[1], fnRef);
    }
  };
  var addTypeReference = function(scope, name, reference) {
    var declaredScope = findTypeScope(scope, name);
    if (declaredScope) {
      declaredScope.types[name].references.push(reference);
    } else {
      warn('Encountered undeclared type: "'.concat(name, '"'));
      scope.types[name] = {
        references: [reference]
      };
    }
  };
  var createType = function(scope, name, declaration) {
    if (name in scope.types) {
      if (scope.types[name].declaration) {
        warn('Encountered duplicate type declaration: "'.concat(name, '"'));
      } else {
        warn('Type "'.concat(name, '" was used before it was declared'));
        scope.types[name].declaration = declaration;
      }
      scope.types[name].references.push(declaration);
    } else {
      scope.types[name] = {
        declaration,
        references: [declaration]
      };
    }
  };
  var addTypeIfFound = function(scope, node2) {
    var _a;
    var specifier = node2.type === "fully_specified_type" ? (_a = node2 === null || node2 === void 0 ? void 0 : node2.specifier) === null || _a === void 0 ? void 0 : _a.specifier : node2 === null || node2 === void 0 ? void 0 : node2.specifier;
    if (specifier.type === "type_name") {
      var name = specifier.identifier;
      addTypeReference(scope, name, specifier);
    } else if (specifier.type !== "struct" && specifier.type !== "keyword") {
      console.warn("Unknown specifier", specifier);
      throw new Error("Unknown declarator specifier ".concat(specifier === null || specifier === void 0 ? void 0 : specifier.type, ". Please file a bug against @shaderfrog/glsl-parser and incldue your source grammar."));
    }
  };
  var createBindings = function(scope) {
    var bindings = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      bindings[_i - 1] = arguments[_i];
    }
    bindings.forEach(function(_a) {
      var identifier = _a[0], binding = _a[1];
      var existing = scope.bindings[identifier];
      if (existing) {
        warn('Encountered duplicate variable declaration: "'.concat(identifier, '"'));
        existing.references.unshift(binding);
      } else {
        scope.bindings[identifier] = makeScopeIndex(binding, binding);
      }
    });
  };
  var addOrCreateBindingReference = function(scope, name, reference) {
    var foundScope = findBindingScope(scope, name);
    if (foundScope) {
      foundScope.bindings[name].references.push(reference);
    } else {
      if (!context.options.stage || context.options.stage === "vertex" && !BUILT_INS.vertex.has(name) || context.options.stage === "fragment" && !BUILT_INS.fragment.has(name) || context.options.stage === "either" && !BUILT_INS.vertex.has(name) && !BUILT_INS.fragment) {
        warn('Encountered undefined variable: "'.concat(name, '"'));
      }
      scope.bindings[name] = makeScopeIndex(reference);
    }
  };
  var groupCases = function(statements) {
    return statements.reduce(function(cases, stmt) {
      var partial2 = "partial" in stmt ? stmt.partial : {};
      if (partial2.type === "case_label") {
        return __spreadArray2(__spreadArray2([], cases, true), [
          node("switch_case", {
            statements: [],
            case: partial2.case,
            test: partial2.test,
            colon: partial2.colon
          })
        ], false);
      } else if (partial2.type === "default_label") {
        return __spreadArray2(__spreadArray2([], cases, true), [
          node("default_case", {
            statements: [],
            default: partial2.default,
            colon: partial2.colon
          })
        ], false);
      } else if (!cases.length) {
        throw new Error("A switch statement body must start with a case or default label");
      } else {
        var tail = cases.slice(-1)[0];
        return __spreadArray2(__spreadArray2([], cases.slice(0, -1), true), [
          __assign(__assign({}, tail), { statements: __spreadArray2(__spreadArray2([], tail.statements, true), [stmt], false) })
        ], false);
      }
    }, []);
  };
  context.scope = makeScope("global");
  context.scopes = [context.scope];
  return {
    getLocation,
    node,
    makeScope,
    warn,
    pushScope,
    popScope,
    setScopeEnd,
    createFunctionDefinition,
    addFunctionCallReference,
    createFunctionPrototype,
    groupCases,
    addTypeReference,
    addTypeIfFound,
    createType,
    createBindings,
    addOrCreateBindingReference
  };
};

// dist/parser/parser.js
var OPEN_CURLY = String.fromCharCode(123);
function peg$subclass(child, parent) {
  function C() {
    this.constructor = child;
  }
  C.prototype = parent.prototype;
  child.prototype = new C();
}
function peg$SyntaxError(message, expected, found, location) {
  var self = Error.call(this, message);
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(self, peg$SyntaxError.prototype);
  }
  self.expected = expected;
  self.found = found;
  self.location = location;
  self.name = "SyntaxError";
  return self;
}
peg$subclass(peg$SyntaxError, Error);
function peg$padEnd(str, targetLength, padString) {
  padString = padString || " ";
  if (str.length > targetLength) {
    return str;
  }
  targetLength -= str.length;
  padString += padString.repeat(targetLength);
  return str + padString.slice(0, targetLength);
}
peg$SyntaxError.prototype.format = function(sources) {
  var str = "Error: " + this.message;
  if (this.location) {
    var src = null;
    var k;
    for (k = 0; k < sources.length; k++) {
      if (sources[k].source === this.location.source) {
        src = sources[k].text.split(/\r\n|\n|\r/g);
        break;
      }
    }
    var s = this.location.start;
    var loc = this.location.source + ":" + s.line + ":" + s.column;
    if (src) {
      var e = this.location.end;
      var filler = peg$padEnd("", s.line.toString().length);
      var line = src[s.line - 1];
      var last = s.line === e.line ? e.column : line.length + 1;
      str += "\n --> " + loc + "\n" + filler + " |\n" + s.line + " | " + line + "\n" + filler + " | " + peg$padEnd("", s.column - 1) + peg$padEnd("", last - s.column, "^");
    } else {
      str += "\n at " + loc;
    }
  }
  return str;
};
peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
    literal: function(expectation) {
      return '"' + literalEscape(expectation.text) + '"';
    },
    class: function(expectation) {
      var escapedParts = expectation.parts.map(function(part) {
        return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
      });
      return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
    },
    any: function() {
      return "any character";
    },
    end: function() {
      return "end of input";
    },
    other: function(expectation) {
      return expectation.description;
    }
  };
  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }
  function literalEscape(s) {
    return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
      return "\\x0" + hex(ch);
    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
      return "\\x" + hex(ch);
    });
  }
  function classEscape(s) {
    return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
      return "\\x0" + hex(ch);
    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
      return "\\x" + hex(ch);
    });
  }
  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }
  function describeExpected(expected2) {
    var descriptions = expected2.map(describeExpectation);
    var i, j;
    descriptions.sort();
    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }
    switch (descriptions.length) {
      case 1:
        return descriptions[0];
      case 2:
        return descriptions[0] + " or " + descriptions[1];
      default:
        return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
    }
  }
  function describeFound(found2) {
    return found2 ? '"' + literalEscape(found2) + '"' : "end of input";
  }
  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};
function peg$parse(input, options) {
  options = options !== void 0 ? options : {};
  var peg$FAILED = {};
  var peg$source = options.grammarSource;
  var peg$startRuleFunctions = { start: peg$parsestart };
  var peg$startRuleFunction = peg$parsestart;
  var peg$c0 = "attribute";
  var peg$c1 = "varying";
  var peg$c2 = "const";
  var peg$c3 = "bool";
  var peg$c4 = "float";
  var peg$c5 = "double";
  var peg$c6 = "int";
  var peg$c7 = "uint";
  var peg$c8 = "break";
  var peg$c9 = "continue";
  var peg$c10 = "do";
  var peg$c11 = "else";
  var peg$c12 = "for";
  var peg$c13 = "if";
  var peg$c14 = "discard";
  var peg$c15 = "return";
  var peg$c16 = "switch";
  var peg$c17 = "case";
  var peg$c18 = "default";
  var peg$c19 = "subroutine";
  var peg$c20 = "bvec2";
  var peg$c21 = "bvec3";
  var peg$c22 = "bvec4";
  var peg$c23 = "ivec2";
  var peg$c24 = "ivec3";
  var peg$c25 = "ivec4";
  var peg$c26 = "uvec2";
  var peg$c27 = "uvec3";
  var peg$c28 = "uvec4";
  var peg$c29 = "vec2";
  var peg$c30 = "vec3";
  var peg$c31 = "vec4";
  var peg$c32 = "mat2";
  var peg$c33 = "mat3";
  var peg$c34 = "mat4";
  var peg$c35 = "centroid";
  var peg$c36 = "in";
  var peg$c37 = "out";
  var peg$c38 = "inout";
  var peg$c39 = "uniform";
  var peg$c40 = "patch";
  var peg$c41 = "sample";
  var peg$c42 = "buffer";
  var peg$c43 = "shared";
  var peg$c44 = "coherent";
  var peg$c45 = "volatile";
  var peg$c46 = "restrict";
  var peg$c47 = "readonly";
  var peg$c48 = "writeonly";
  var peg$c49 = "dvec2";
  var peg$c50 = "dvec3";
  var peg$c51 = "dvec4";
  var peg$c52 = "dmat2";
  var peg$c53 = "dmat3";
  var peg$c54 = "dmat4";
  var peg$c55 = "noperspective";
  var peg$c56 = "flat";
  var peg$c57 = "smooth";
  var peg$c58 = "layout";
  var peg$c59 = "mat2x2";
  var peg$c60 = "mat2x3";
  var peg$c61 = "mat2x4";
  var peg$c62 = "mat3x2";
  var peg$c63 = "mat3x3";
  var peg$c64 = "mat3x4";
  var peg$c65 = "mat4x2";
  var peg$c66 = "mat4x3";
  var peg$c67 = "mat4x4";
  var peg$c68 = "dmat2x2";
  var peg$c69 = "dmat2x3";
  var peg$c70 = "dmat2x4";
  var peg$c71 = "dmat3x2";
  var peg$c72 = "dmat3x3";
  var peg$c73 = "dmat3x4";
  var peg$c74 = "dmat4x2";
  var peg$c75 = "dmat4x3";
  var peg$c76 = "dmat4x4";
  var peg$c77 = "atomic_uint";
  var peg$c78 = "sampler1D";
  var peg$c79 = "sampler2D";
  var peg$c80 = "sampler3D";
  var peg$c81 = "samplerCube";
  var peg$c82 = "sampler1DShadow";
  var peg$c83 = "sampler2DShadow";
  var peg$c84 = "samplerCubeShadow";
  var peg$c85 = "sampler1DArray";
  var peg$c86 = "sampler2DArray";
  var peg$c87 = "sampler1DArrayShadow";
  var peg$c88 = "sampler2DArrayShadow";
  var peg$c89 = "isampler1D";
  var peg$c90 = "isampler2D";
  var peg$c91 = "isampler3D";
  var peg$c92 = "isamplerCube";
  var peg$c93 = "isampler1Darray";
  var peg$c94 = "isampler2DArray";
  var peg$c95 = "usampler1D";
  var peg$c96 = "usampler2D";
  var peg$c97 = "usampler3D";
  var peg$c98 = "usamplerCube";
  var peg$c99 = "usampler1DArray";
  var peg$c100 = "usampler2DArray";
  var peg$c101 = "sampler2DRect";
  var peg$c102 = "sampler2DRectShadow";
  var peg$c103 = "isampler2DRect";
  var peg$c104 = "usampler2DRect";
  var peg$c105 = "samplerBuffer";
  var peg$c106 = "isamplerBuffer";
  var peg$c107 = "usamplerBuffer";
  var peg$c108 = "samplerCubeArray";
  var peg$c109 = "samplerCubeArrayShadow";
  var peg$c110 = "isamplerCubeArray";
  var peg$c111 = "usamplerCubeArray";
  var peg$c112 = "sampler2DMS";
  var peg$c113 = "isampler2DMS";
  var peg$c114 = "usampler2DMS";
  var peg$c115 = "sampler2DMSArray";
  var peg$c116 = "isampler2DMSArray";
  var peg$c117 = "usampler2DMSArray";
  var peg$c118 = "image1D";
  var peg$c119 = "iimage1D";
  var peg$c120 = "uimage1D";
  var peg$c121 = "image2D";
  var peg$c122 = "iimage2D";
  var peg$c123 = "uimage2D";
  var peg$c124 = "image3D";
  var peg$c125 = "iimage3D";
  var peg$c126 = "uimage3D";
  var peg$c127 = "image2DRect";
  var peg$c128 = "iimage2DRect";
  var peg$c129 = "uimage2DRect";
  var peg$c130 = "imageCube";
  var peg$c131 = "iimageCube";
  var peg$c132 = "uimageCube";
  var peg$c133 = "imageBuffer";
  var peg$c134 = "iimageBuffer";
  var peg$c135 = "uimageBuffer";
  var peg$c136 = "image1DArray";
  var peg$c137 = "iimage1DArray";
  var peg$c138 = "uimage1DArray";
  var peg$c139 = "image2DArray";
  var peg$c140 = "iimage2DArray";
  var peg$c141 = "uimage2DArray";
  var peg$c142 = "imageCubeArray";
  var peg$c143 = "iimageCubeArray";
  var peg$c144 = "uimageCubeArray";
  var peg$c145 = "image2DMS";
  var peg$c146 = "iimage2DMS";
  var peg$c147 = "uimage2DMS";
  var peg$c148 = "image2DMArray";
  var peg$c149 = "iimage2DMSArray";
  var peg$c150 = "uimage2DMSArray";
  var peg$c151 = "struct";
  var peg$c152 = "void";
  var peg$c153 = "while";
  var peg$c154 = "invariant";
  var peg$c155 = "precise";
  var peg$c156 = "highp";
  var peg$c157 = "mediump";
  var peg$c158 = "lowp";
  var peg$c159 = "precision";
  var peg$c160 = "true";
  var peg$c161 = "false";
  var peg$c162 = "<<";
  var peg$c163 = ">>";
  var peg$c164 = "++";
  var peg$c165 = "--";
  var peg$c166 = "<=";
  var peg$c167 = ">=";
  var peg$c168 = "==";
  var peg$c169 = "!=";
  var peg$c170 = "&&";
  var peg$c171 = "||";
  var peg$c172 = "^^";
  var peg$c173 = "*=";
  var peg$c174 = "/=";
  var peg$c175 = "+=";
  var peg$c176 = "%=";
  var peg$c177 = "<<=";
  var peg$c178 = ">>=";
  var peg$c179 = "&=";
  var peg$c180 = "^=";
  var peg$c181 = "|=";
  var peg$c182 = "-=";
  var peg$c183 = "(";
  var peg$c184 = ")";
  var peg$c185 = "[";
  var peg$c186 = "]";
  var peg$c187 = "{";
  var peg$c188 = "}";
  var peg$c189 = ".";
  var peg$c190 = ",";
  var peg$c191 = ":";
  var peg$c192 = "=";
  var peg$c193 = ";";
  var peg$c194 = "!";
  var peg$c195 = "-";
  var peg$c196 = "~";
  var peg$c197 = "+";
  var peg$c198 = "*";
  var peg$c199 = "/";
  var peg$c200 = "%";
  var peg$c201 = "<";
  var peg$c202 = ">";
  var peg$c203 = "|";
  var peg$c204 = "^";
  var peg$c205 = "&";
  var peg$c206 = "?";
  var peg$c207 = "0";
  var peg$c208 = "lf";
  var peg$c209 = "LF";
  var peg$c210 = "#";
  var peg$c211 = "//";
  var peg$c212 = "/*";
  var peg$c213 = "*/";
  var peg$r0 = /^[A-Za-z_]/;
  var peg$r1 = /^[A-Za-z_0-9]/;
  var peg$r2 = /^[uU]/;
  var peg$r3 = /^[1-9]/;
  var peg$r4 = /^[0-7]/;
  var peg$r5 = /^[xX]/;
  var peg$r6 = /^[0-9a-fA-F]/;
  var peg$r7 = /^[0-9]/;
  var peg$r8 = /^[eE]/;
  var peg$r9 = /^[+\-]/;
  var peg$r10 = /^[fF]/;
  var peg$r11 = /^[^\n]/;
  var peg$r12 = /^[ \t\n\r]/;
  var peg$e0 = peg$literalExpectation("attribute", false);
  var peg$e1 = peg$literalExpectation("varying", false);
  var peg$e2 = peg$literalExpectation("const", false);
  var peg$e3 = peg$literalExpectation("bool", false);
  var peg$e4 = peg$literalExpectation("float", false);
  var peg$e5 = peg$literalExpectation("double", false);
  var peg$e6 = peg$literalExpectation("int", false);
  var peg$e7 = peg$literalExpectation("uint", false);
  var peg$e8 = peg$literalExpectation("break", false);
  var peg$e9 = peg$literalExpectation("continue", false);
  var peg$e10 = peg$literalExpectation("do", false);
  var peg$e11 = peg$literalExpectation("else", false);
  var peg$e12 = peg$literalExpectation("for", false);
  var peg$e13 = peg$literalExpectation("if", false);
  var peg$e14 = peg$literalExpectation("discard", false);
  var peg$e15 = peg$literalExpectation("return", false);
  var peg$e16 = peg$literalExpectation("switch", false);
  var peg$e17 = peg$literalExpectation("case", false);
  var peg$e18 = peg$literalExpectation("default", false);
  var peg$e19 = peg$literalExpectation("subroutine", false);
  var peg$e20 = peg$literalExpectation("bvec2", false);
  var peg$e21 = peg$literalExpectation("bvec3", false);
  var peg$e22 = peg$literalExpectation("bvec4", false);
  var peg$e23 = peg$literalExpectation("ivec2", false);
  var peg$e24 = peg$literalExpectation("ivec3", false);
  var peg$e25 = peg$literalExpectation("ivec4", false);
  var peg$e26 = peg$literalExpectation("uvec2", false);
  var peg$e27 = peg$literalExpectation("uvec3", false);
  var peg$e28 = peg$literalExpectation("uvec4", false);
  var peg$e29 = peg$literalExpectation("vec2", false);
  var peg$e30 = peg$literalExpectation("vec3", false);
  var peg$e31 = peg$literalExpectation("vec4", false);
  var peg$e32 = peg$literalExpectation("mat2", false);
  var peg$e33 = peg$literalExpectation("mat3", false);
  var peg$e34 = peg$literalExpectation("mat4", false);
  var peg$e35 = peg$literalExpectation("centroid", false);
  var peg$e36 = peg$literalExpectation("in", false);
  var peg$e37 = peg$literalExpectation("out", false);
  var peg$e38 = peg$literalExpectation("inout", false);
  var peg$e39 = peg$literalExpectation("uniform", false);
  var peg$e40 = peg$literalExpectation("patch", false);
  var peg$e41 = peg$literalExpectation("sample", false);
  var peg$e42 = peg$literalExpectation("buffer", false);
  var peg$e43 = peg$literalExpectation("shared", false);
  var peg$e44 = peg$literalExpectation("coherent", false);
  var peg$e45 = peg$literalExpectation("volatile", false);
  var peg$e46 = peg$literalExpectation("restrict", false);
  var peg$e47 = peg$literalExpectation("readonly", false);
  var peg$e48 = peg$literalExpectation("writeonly", false);
  var peg$e49 = peg$literalExpectation("dvec2", false);
  var peg$e50 = peg$literalExpectation("dvec3", false);
  var peg$e51 = peg$literalExpectation("dvec4", false);
  var peg$e52 = peg$literalExpectation("dmat2", false);
  var peg$e53 = peg$literalExpectation("dmat3", false);
  var peg$e54 = peg$literalExpectation("dmat4", false);
  var peg$e55 = peg$literalExpectation("noperspective", false);
  var peg$e56 = peg$literalExpectation("flat", false);
  var peg$e57 = peg$literalExpectation("smooth", false);
  var peg$e58 = peg$literalExpectation("layout", false);
  var peg$e59 = peg$literalExpectation("mat2x2", false);
  var peg$e60 = peg$literalExpectation("mat2x3", false);
  var peg$e61 = peg$literalExpectation("mat2x4", false);
  var peg$e62 = peg$literalExpectation("mat3x2", false);
  var peg$e63 = peg$literalExpectation("mat3x3", false);
  var peg$e64 = peg$literalExpectation("mat3x4", false);
  var peg$e65 = peg$literalExpectation("mat4x2", false);
  var peg$e66 = peg$literalExpectation("mat4x3", false);
  var peg$e67 = peg$literalExpectation("mat4x4", false);
  var peg$e68 = peg$literalExpectation("dmat2x2", false);
  var peg$e69 = peg$literalExpectation("dmat2x3", false);
  var peg$e70 = peg$literalExpectation("dmat2x4", false);
  var peg$e71 = peg$literalExpectation("dmat3x2", false);
  var peg$e72 = peg$literalExpectation("dmat3x3", false);
  var peg$e73 = peg$literalExpectation("dmat3x4", false);
  var peg$e74 = peg$literalExpectation("dmat4x2", false);
  var peg$e75 = peg$literalExpectation("dmat4x3", false);
  var peg$e76 = peg$literalExpectation("dmat4x4", false);
  var peg$e77 = peg$literalExpectation("atomic_uint", false);
  var peg$e78 = peg$literalExpectation("sampler1D", false);
  var peg$e79 = peg$literalExpectation("sampler2D", false);
  var peg$e80 = peg$literalExpectation("sampler3D", false);
  var peg$e81 = peg$literalExpectation("samplerCube", false);
  var peg$e82 = peg$literalExpectation("sampler1DShadow", false);
  var peg$e83 = peg$literalExpectation("sampler2DShadow", false);
  var peg$e84 = peg$literalExpectation("samplerCubeShadow", false);
  var peg$e85 = peg$literalExpectation("sampler1DArray", false);
  var peg$e86 = peg$literalExpectation("sampler2DArray", false);
  var peg$e87 = peg$literalExpectation("sampler1DArrayShadow", false);
  var peg$e88 = peg$literalExpectation("sampler2DArrayShadow", false);
  var peg$e89 = peg$literalExpectation("isampler1D", false);
  var peg$e90 = peg$literalExpectation("isampler2D", false);
  var peg$e91 = peg$literalExpectation("isampler3D", false);
  var peg$e92 = peg$literalExpectation("isamplerCube", false);
  var peg$e93 = peg$literalExpectation("isampler1Darray", false);
  var peg$e94 = peg$literalExpectation("isampler2DArray", false);
  var peg$e95 = peg$literalExpectation("usampler1D", false);
  var peg$e96 = peg$literalExpectation("usampler2D", false);
  var peg$e97 = peg$literalExpectation("usampler3D", false);
  var peg$e98 = peg$literalExpectation("usamplerCube", false);
  var peg$e99 = peg$literalExpectation("usampler1DArray", false);
  var peg$e100 = peg$literalExpectation("usampler2DArray", false);
  var peg$e101 = peg$literalExpectation("sampler2DRect", false);
  var peg$e102 = peg$literalExpectation("sampler2DRectShadow", false);
  var peg$e103 = peg$literalExpectation("isampler2DRect", false);
  var peg$e104 = peg$literalExpectation("usampler2DRect", false);
  var peg$e105 = peg$literalExpectation("samplerBuffer", false);
  var peg$e106 = peg$literalExpectation("isamplerBuffer", false);
  var peg$e107 = peg$literalExpectation("usamplerBuffer", false);
  var peg$e108 = peg$literalExpectation("samplerCubeArray", false);
  var peg$e109 = peg$literalExpectation("samplerCubeArrayShadow", false);
  var peg$e110 = peg$literalExpectation("isamplerCubeArray", false);
  var peg$e111 = peg$literalExpectation("usamplerCubeArray", false);
  var peg$e112 = peg$literalExpectation("sampler2DMS", false);
  var peg$e113 = peg$literalExpectation("isampler2DMS", false);
  var peg$e114 = peg$literalExpectation("usampler2DMS", false);
  var peg$e115 = peg$literalExpectation("sampler2DMSArray", false);
  var peg$e116 = peg$literalExpectation("isampler2DMSArray", false);
  var peg$e117 = peg$literalExpectation("usampler2DMSArray", false);
  var peg$e118 = peg$literalExpectation("image1D", false);
  var peg$e119 = peg$literalExpectation("iimage1D", false);
  var peg$e120 = peg$literalExpectation("uimage1D", false);
  var peg$e121 = peg$literalExpectation("image2D", false);
  var peg$e122 = peg$literalExpectation("iimage2D", false);
  var peg$e123 = peg$literalExpectation("uimage2D", false);
  var peg$e124 = peg$literalExpectation("image3D", false);
  var peg$e125 = peg$literalExpectation("iimage3D", false);
  var peg$e126 = peg$literalExpectation("uimage3D", false);
  var peg$e127 = peg$literalExpectation("image2DRect", false);
  var peg$e128 = peg$literalExpectation("iimage2DRect", false);
  var peg$e129 = peg$literalExpectation("uimage2DRect", false);
  var peg$e130 = peg$literalExpectation("imageCube", false);
  var peg$e131 = peg$literalExpectation("iimageCube", false);
  var peg$e132 = peg$literalExpectation("uimageCube", false);
  var peg$e133 = peg$literalExpectation("imageBuffer", false);
  var peg$e134 = peg$literalExpectation("iimageBuffer", false);
  var peg$e135 = peg$literalExpectation("uimageBuffer", false);
  var peg$e136 = peg$literalExpectation("image1DArray", false);
  var peg$e137 = peg$literalExpectation("iimage1DArray", false);
  var peg$e138 = peg$literalExpectation("uimage1DArray", false);
  var peg$e139 = peg$literalExpectation("image2DArray", false);
  var peg$e140 = peg$literalExpectation("iimage2DArray", false);
  var peg$e141 = peg$literalExpectation("uimage2DArray", false);
  var peg$e142 = peg$literalExpectation("imageCubeArray", false);
  var peg$e143 = peg$literalExpectation("iimageCubeArray", false);
  var peg$e144 = peg$literalExpectation("uimageCubeArray", false);
  var peg$e145 = peg$literalExpectation("image2DMS", false);
  var peg$e146 = peg$literalExpectation("iimage2DMS", false);
  var peg$e147 = peg$literalExpectation("uimage2DMS", false);
  var peg$e148 = peg$literalExpectation("image2DMArray", false);
  var peg$e149 = peg$literalExpectation("iimage2DMSArray", false);
  var peg$e150 = peg$literalExpectation("uimage2DMSArray", false);
  var peg$e151 = peg$literalExpectation("struct", false);
  var peg$e152 = peg$literalExpectation("void", false);
  var peg$e153 = peg$literalExpectation("while", false);
  var peg$e154 = peg$literalExpectation("invariant", false);
  var peg$e155 = peg$literalExpectation("precise", false);
  var peg$e156 = peg$literalExpectation("highp", false);
  var peg$e157 = peg$literalExpectation("mediump", false);
  var peg$e158 = peg$literalExpectation("lowp", false);
  var peg$e159 = peg$literalExpectation("precision", false);
  var peg$e160 = peg$literalExpectation("true", false);
  var peg$e161 = peg$literalExpectation("false", false);
  var peg$e162 = peg$otherExpectation("keyword");
  var peg$e163 = peg$literalExpectation("<<", false);
  var peg$e164 = peg$literalExpectation(">>", false);
  var peg$e165 = peg$literalExpectation("++", false);
  var peg$e166 = peg$literalExpectation("--", false);
  var peg$e167 = peg$literalExpectation("<=", false);
  var peg$e168 = peg$literalExpectation(">=", false);
  var peg$e169 = peg$literalExpectation("==", false);
  var peg$e170 = peg$literalExpectation("!=", false);
  var peg$e171 = peg$literalExpectation("&&", false);
  var peg$e172 = peg$literalExpectation("||", false);
  var peg$e173 = peg$literalExpectation("^^", false);
  var peg$e174 = peg$literalExpectation("*=", false);
  var peg$e175 = peg$literalExpectation("/=", false);
  var peg$e176 = peg$literalExpectation("+=", false);
  var peg$e177 = peg$literalExpectation("%=", false);
  var peg$e178 = peg$literalExpectation("<<=", false);
  var peg$e179 = peg$literalExpectation(">>=", false);
  var peg$e180 = peg$literalExpectation("&=", false);
  var peg$e181 = peg$literalExpectation("^=", false);
  var peg$e182 = peg$literalExpectation("|=", false);
  var peg$e183 = peg$literalExpectation("-=", false);
  var peg$e184 = peg$literalExpectation("(", false);
  var peg$e185 = peg$literalExpectation(")", false);
  var peg$e186 = peg$literalExpectation("[", false);
  var peg$e187 = peg$literalExpectation("]", false);
  var peg$e188 = peg$literalExpectation("{", false);
  var peg$e189 = peg$literalExpectation("}", false);
  var peg$e190 = peg$literalExpectation(".", false);
  var peg$e191 = peg$literalExpectation(",", false);
  var peg$e192 = peg$literalExpectation(":", false);
  var peg$e193 = peg$literalExpectation("=", false);
  var peg$e194 = peg$literalExpectation(";", false);
  var peg$e195 = peg$literalExpectation("!", false);
  var peg$e196 = peg$literalExpectation("-", false);
  var peg$e197 = peg$literalExpectation("~", false);
  var peg$e198 = peg$literalExpectation("+", false);
  var peg$e199 = peg$literalExpectation("*", false);
  var peg$e200 = peg$literalExpectation("/", false);
  var peg$e201 = peg$literalExpectation("%", false);
  var peg$e202 = peg$literalExpectation("<", false);
  var peg$e203 = peg$literalExpectation(">", false);
  var peg$e204 = peg$literalExpectation("|", false);
  var peg$e205 = peg$literalExpectation("^", false);
  var peg$e206 = peg$literalExpectation("&", false);
  var peg$e207 = peg$literalExpectation("?", false);
  var peg$e208 = peg$classExpectation([["A", "Z"], ["a", "z"], "_"], false, false);
  var peg$e209 = peg$classExpectation([["A", "Z"], ["a", "z"], "_", ["0", "9"]], false, false);
  var peg$e210 = peg$classExpectation(["u", "U"], false, false);
  var peg$e211 = peg$classExpectation([["1", "9"]], false, false);
  var peg$e212 = peg$literalExpectation("0", false);
  var peg$e213 = peg$classExpectation([["0", "7"]], false, false);
  var peg$e214 = peg$classExpectation(["x", "X"], false, false);
  var peg$e215 = peg$classExpectation([["0", "9"], ["a", "f"], ["A", "F"]], false, false);
  var peg$e216 = peg$classExpectation([["0", "9"]], false, false);
  var peg$e217 = peg$otherExpectation("exponent");
  var peg$e218 = peg$classExpectation(["e", "E"], false, false);
  var peg$e219 = peg$classExpectation(["+", "-"], false, false);
  var peg$e220 = peg$classExpectation(["f", "F"], false, false);
  var peg$e221 = peg$literalExpectation("lf", false);
  var peg$e222 = peg$literalExpectation("LF", false);
  var peg$e223 = peg$otherExpectation("primary expression");
  var peg$e224 = peg$otherExpectation("unary expression");
  var peg$e225 = peg$otherExpectation("equality expression");
  var peg$e226 = peg$otherExpectation("and expression");
  var peg$e227 = peg$otherExpectation("asignment");
  var peg$e228 = peg$otherExpectation("expression");
  var peg$e229 = peg$otherExpectation("precision statement");
  var peg$e230 = peg$otherExpectation("function prototype");
  var peg$e231 = peg$otherExpectation("function header");
  var peg$e232 = peg$otherExpectation("function prototype scope");
  var peg$e233 = peg$otherExpectation("function header scope");
  var peg$e234 = peg$otherExpectation("function parameters");
  var peg$e235 = peg$otherExpectation("parameter declaration");
  var peg$e236 = peg$otherExpectation("single type qualifier");
  var peg$e237 = peg$otherExpectation("interpolation qualifier");
  var peg$e238 = peg$otherExpectation("storage qualifier");
  var peg$e239 = peg$otherExpectation("type specifier");
  var peg$e240 = peg$otherExpectation("array specifier");
  var peg$e241 = peg$otherExpectation("precision qualifier");
  var peg$e242 = peg$otherExpectation("struct specifier");
  var peg$e243 = peg$otherExpectation("iteration statement");
  var peg$e244 = peg$otherExpectation("jump statement");
  var peg$e245 = peg$otherExpectation("prepocessor");
  var peg$e246 = peg$literalExpectation("#", false);
  var peg$e247 = peg$classExpectation(["\n"], true, false);
  var peg$e248 = peg$otherExpectation("whitespace");
  var peg$e249 = peg$literalExpectation("//", false);
  var peg$e250 = peg$literalExpectation("/*", false);
  var peg$e251 = peg$literalExpectation("*/", false);
  var peg$e252 = peg$anyExpectation();
  var peg$e253 = peg$classExpectation([" ", "	", "\n", "\r"], false, false);
  var peg$f0 = function(wsStart, program) {
    setScopeEnd(context.scope, getLocation()?.end);
    return node("program", { wsStart, program, scopes: context.scopes });
  };
  var peg$f1 = function(token, t) {
    return node("keyword", { token, whitespace: t });
  };
  var peg$f2 = function(token, _) {
    return node("float_constant", { token, whitespace: _ });
  };
  var peg$f3 = function(token, _) {
    return node("double_constant", { token, whitespace: _ });
  };
  var peg$f4 = function(token, _) {
    return node("int_constant", { token, whitespace: _ });
  };
  var peg$f5 = function(token, _) {
    return node("uint_constant", { token, whitespace: _ });
  };
  var peg$f6 = function(token, t) {
    return node("bool_constant", { token, whitespace: t });
  };
  var peg$f7 = function(token, _) {
    return node("literal", { literal: token, whitespace: _ });
  };
  var peg$f8 = function(identifier, _) {
    return node("identifier", { identifier, whitespace: _ });
  };
  var peg$f9 = function(identifier, _) {
    return node("type_name", { identifier, whitespace: _ });
  };
  var peg$f10 = function(lp, expression, rp) {
    return node("group", { lp, expression, rp });
  };
  var peg$f11 = function(ident) {
    const { identifier } = ident;
    addOrCreateBindingReference(context.scope, identifier, ident);
    return ident;
  };
  var peg$f12 = function(body) {
    return body.flat().reduceRight(
      (postfix, expression) => postfix ? node("postfix", { expression, postfix }) : expression
    );
  };
  var peg$f13 = function(lb, expression, rb) {
    return node("quantifier", { lb, expression, rb });
  };
  var peg$f14 = function(dot, selection) {
    return node("field_selection", { dot, selection });
  };
  var peg$f15 = function(function_identifier, args, rp) {
    const identifierPartial = function_identifier.partial;
    const { identifier } = identifierPartial;
    let fnIdentifier = identifier.type === "postfix" ? identifier.expression.identifier ? identifier.expression.identifier.specifier : identifier.expression.specifier : identifier.specifier;
    let fnName = fnIdentifier.identifier;
    const n = node("function_call", { ...identifierPartial, args: args || [], rp });
    const isDeclaredFn = isDeclaredFunction(context.scope, fnName);
    const isBuiltIn = FN_BUILT_INS.has(fnName);
    const isType = isDeclaredType(context.scope, fnName);
    if (fnName) {
      if (!isType && fnIdentifier.type === "type_name" && (!isDeclaredFn || isBuiltIn)) {
        fnIdentifier = node("identifier", {
          identifier: fnIdentifier.identifier,
          whitespace: fnIdentifier.whitespace
        });
        if (n.identifier.type === "postfix") {
          n.identifier.expression.identifier = fnIdentifier;
        } else {
          n.identifier = fnIdentifier;
        }
      }
      if (
        // You can override built-in functions like "noise", so only add
        // "noise" to scope usage if it's declared by the user
        isDeclaredFn || !isBuiltIn
      ) {
        if (isType) {
          if (identifier.type === "type_specifier") {
            addTypeReference(
              context.scope,
              fnName,
              identifier.specifier
            );
          } else {
            throw new Error(`Unknown function call identifier type ${identifier.type}. Please file a bug against @shaderfrog/glsl-parser and incldue your source grammar.`);
          }
        } else {
          addFunctionCallReference(context.scope, fnName, n);
        }
      }
    }
    return n;
  };
  var peg$f16 = function(v) {
    return [v];
  };
  var peg$f17 = function(head, tail) {
    return [head, ...tail.flat()];
  };
  var peg$f18 = function(head, suffix, lp) {
    return partial({ head: [head, suffix], lp });
  };
  var peg$f19 = function(identifier) {
    return partial({
      lp: identifier.partial.lp,
      identifier: [identifier.partial.head].flat().reduceRight(
        (postfix, expression) => postfix ? node("postfix", { expression, postfix }) : expression
      )
    });
  };
  var peg$f20 = function(identifier, lp, args, rp) {
    return node("function_call", { identifier, lp, args, rp });
  };
  var peg$f21 = function(operator, expression) {
    return node("unary", { operator, expression });
  };
  var peg$f22 = function(head, tail) {
    return leftAssociate(head, tail);
  };
  var peg$f23 = function(expression, question, left, colon, right) {
    return { question, left, right, colon };
  };
  var peg$f24 = function(expression, suffix) {
    return suffix ? node("ternary", { expression, ...suffix }) : expression;
  };
  var peg$f25 = function(left, operator, right) {
    return node("assignment", { left, operator, right });
  };
  var peg$f26 = function(declaration) {
    return node(
      "declaration_statement",
      {
        declaration: declaration.partial.node,
        semi: declaration.partial.semi
      }
    );
  };
  var peg$f27 = function(qualifiers, head, tail, semi) {
    return partial({
      node: node(
        "qualifier_declarator",
        {
          qualifiers,
          // Head is optional, so remove falsey
          declarations: xnil([head, ...tail.map((t) => t[1])]),
          commas: tail.map((t) => t[0])
        }
      ),
      semi
    });
  };
  var peg$f28 = function(qualifiers, interface_type, lp, declarations, rp, identifier, semi) {
    const n = node(
      "interface_declarator",
      { qualifiers, interface_type, lp, declarations, rp, identifier }
    );
    createBindings(context.scope, [interface_type.identifier, n]);
    return partial({
      node: n,
      semi
    });
  };
  var peg$f29 = function(prefix, qualifier, specifier, semi) {
    return partial({
      node: node("precision", { prefix, qualifier, specifier }),
      semi
    });
  };
  var peg$f30 = function(header, params, rp) {
    const bindings = (params?.parameters || []).filter((p) => !!p.identifier).map((p) => [p.identifier.identifier, p]);
    createBindings(context.scope, ...bindings);
    return node("function_prototype", { header, ...params, rp });
  };
  var peg$f31 = function(returnType, name, lp) {
    const n = node(
      "function_header",
      { returnType, name, lp }
    );
    context.scope = pushScope(makeScope(name.identifier, context.scope, lp.location));
    return n;
  };
  var peg$f32 = function(header, params, rp) {
    return node("function_prototype", { header, ...params, rp });
  };
  var peg$f33 = function(returnType, name, lp) {
    return node(
      "function_header",
      { returnType, name, lp }
    );
  };
  var peg$f34 = function(head, tail) {
    return {
      parameters: [head, ...tail.map((t) => t[1])],
      commas: tail.map((t) => t[0])
    };
  };
  var peg$f35 = function(qualifier, specifier, declaration) {
    return node(
      "parameter_declaration",
      {
        qualifier,
        specifier,
        identifier: declaration?.[0],
        quantifier: declaration?.[1]
      }
    );
  };
  var peg$f36 = function(head, tail, semi) {
    const declarations = [
      head.partial.declaration,
      ...tail.map((t) => t[1])
    ].filter((decl) => !!decl.identifier);
    addTypeIfFound(context.scope, head.partial.specified_type);
    createBindings(context.scope, ...tail.map((t) => t[1]).map((decl) => [decl.identifier.identifier, decl]));
    return partial({
      node: node(
        "declarator_list",
        {
          specified_type: head.partial.specified_type,
          declarations,
          commas: tail.map((t) => t[0])
        }
      ),
      semi
    });
  };
  var peg$f37 = function(identifier, quantifier, suffix) {
    const [equal, initializer] = suffix || [];
    return node(
      "declaration",
      { identifier, quantifier, equal, initializer }
    );
  };
  var peg$f38 = function(specified_type, suffix) {
    const [identifier, quantifier, suffix_tail] = suffix || [];
    const [equal, initializer] = suffix_tail || [];
    if (identifier) {
      createBindings(context.scope, [identifier.identifier, identifier]);
    }
    return partial({
      declaration: node(
        "declaration",
        { identifier, quantifier, equal, initializer }
      ),
      specified_type
    });
  };
  var peg$f39 = function(qualifiers, specifier) {
    return node(
      "fully_specified_type",
      { qualifiers, specifier }
    );
  };
  var peg$f40 = function(layout, lp, head, tail) {
    return partial({
      qualifiers: [head, ...tail.map((t) => t[1])],
      commas: tail.map((t) => t[0])
    });
  };
  var peg$f41 = function(layout, lp, qualifiers, rp) {
    return node(
      "layout_qualifier",
      { layout, lp, ...qualifiers.partial, rp }
    );
  };
  var peg$f42 = function(identifier, tail) {
    const [operator, expression] = tail || [];
    return node("layout_qualifier_id", { identifier, operator, expression });
  };
  var peg$f43 = function(subroutine, lp, head, tail, rp) {
    return partial({
      lp,
      type_names: [head, ...tail.map((t) => t[1])],
      commas: tail.map((t) => t[0]),
      rp
    });
  };
  var peg$f44 = function(subroutine, type_names) {
    return node(
      "subroutine_qualifier",
      {
        subroutine,
        ...type_names?.partial
      }
    );
  };
  var peg$f45 = function(specifier, quantifier) {
    return node("type_specifier", { specifier, quantifier });
  };
  var peg$f46 = function(lb, expression, rb) {
    return node("array_specifier", { lb, expression, rb });
  };
  var peg$f47 = function(specifiers) {
    return specifiers;
  };
  var peg$f48 = function(struct, typeName, lb, declarations, rb) {
    const n = node("struct", { lb, declarations, rb, struct, typeName });
    if (typeName) {
      createType(context.scope, typeName.identifier, n.typeName);
    }
    return n;
  };
  var peg$f49 = function(declaration, semi) {
    addTypeIfFound(context.scope, declaration.specified_type);
    return node("struct_declaration", { declaration, semi });
  };
  var peg$f50 = function(specified_type, head, tail) {
    if (specified_type)
      return node(
        "struct_declarator",
        {
          specified_type,
          declarations: [head, ...tail.map((t) => t[1])],
          commas: tail.map((t) => t[0])
        }
      );
  };
  var peg$f51 = function(identifier, quantifier) {
    return node("quantified_identifier", { identifier, quantifier });
  };
  var peg$f52 = function(lb, head, tail, trailing, rb) {
    return node(
      "initializer_list",
      {
        lb,
        initializers: [head, ...tail.map((t) => t[1])],
        commas: xnil(tail.map((t) => t[0]), trailing),
        rb
      }
    );
  };
  var peg$f53 = function(sym) {
    context.scope = pushScope(makeScope(OPEN_CURLY, context.scope));
    return sym;
  };
  var peg$f54 = function(lb, statements, rb) {
    setScopeEnd(context.scope, rb.location?.start);
    context.scope = popScope(context.scope);
    return node(
      "compound_statement",
      { lb, statements: (statements || []).flat(), rb }
    );
  };
  var peg$f55 = function(lb, statements, rb) {
    return node(
      "compound_statement",
      { lb, statements: (statements || []).flat(), rb }
    );
  };
  var peg$f56 = function(expression, semi) {
    return node("expression_statement", { expression, semi });
  };
  var peg$f57 = function(ifSymbol, lp, condition, rp, tail) {
    const [body, elseBranch] = tail;
    return node(
      "if_statement",
      {
        "if": ifSymbol,
        body,
        lp,
        condition,
        rp,
        ...elseBranch && { "else": elseBranch.flat() }
      }
    );
  };
  var peg$f58 = function(switchSymbol, lp, expression, rp, lb, statements, rb) {
    return node(
      "switch_statement",
      {
        switch: switchSymbol,
        lp,
        expression,
        rp,
        lb,
        cases: groupCases(statements),
        rb
      }
    );
  };
  var peg$f59 = function(caseSymbol, test, colon) {
    return partial("case_label", { "case": caseSymbol, test, colon });
  };
  var peg$f60 = function(defaultSymbol, colon) {
    return partial("default_label", { default: defaultSymbol, colon });
  };
  var peg$f61 = function(sym) {
    context.scope = pushScope(makeScope("while", context.scope));
    return sym;
  };
  var peg$f62 = function(whileSymbol, lp, condition, rp, body) {
    const end = body.rb ? body.rb.location?.start : body.location?.end;
    setScopeEnd(context.scope, end);
    context.scope = popScope(context.scope);
    return node(
      "while_statement",
      {
        while: whileSymbol,
        lp,
        condition,
        rp,
        body
      }
    );
  };
  var peg$f63 = function(doSymbol, body, whileSymbol, lp, expression, rp, semi) {
    return node(
      "do_statement",
      {
        do: doSymbol,
        body,
        while: whileSymbol,
        lp,
        expression,
        rp,
        semi
      }
    );
  };
  var peg$f64 = function(sym) {
    context.scope = pushScope(makeScope("for", context.scope));
    return sym;
  };
  var peg$f65 = function(forSymbol, lp, init, condition, conditionSemi, operation, rp, body) {
    const end = body.rb ? body.rb.location?.start : body.location?.end;
    setScopeEnd(context.scope, end);
    context.scope = popScope(context.scope);
    return node(
      "for_statement",
      {
        "for": forSymbol,
        body,
        lp,
        init: init.expression || init.declaration,
        initSemi: init.semi,
        condition,
        conditionSemi,
        operation,
        rp
      }
    );
  };
  var peg$f66 = function(specified_type, identifier, operator, initializer) {
    const n = node(
      "condition_expression",
      { specified_type, identifier, operator, initializer }
    );
    createBindings(context.scope, [identifier.identifier, n]);
    return n;
  };
  var peg$f67 = function(jump, semi) {
    return node("continue_statement", { continue: jump, semi });
  };
  var peg$f68 = function(jump, semi) {
    return node("break_statement", { break: jump, semi });
  };
  var peg$f69 = function(jump, expression, semi) {
    return node("return_statement", { return: jump, expression, semi });
  };
  var peg$f70 = function(jump, semi) {
    return node("discard_statement", { discard: jump, semi });
  };
  var peg$f71 = function(line, _) {
    return node("preprocessor", { line, _ });
  };
  var peg$f72 = function(declaration, semi) {
    (declaration.parameters || []).forEach((p) => addTypeIfFound(context.scope, p.specifier));
    addTypeIfFound(context.scope, declaration.header.returnType);
    createFunctionPrototype(context.scope, declaration.header.name.identifier, declaration);
    const n = node(
      "declaration_statement",
      {
        declaration,
        semi
      }
    );
    return n;
  };
  var peg$f73 = function(prototype, body) {
    const n = node("function", { prototype, body });
    setScopeEnd(context.scope, body.rb.location?.start);
    context.scope = popScope(context.scope);
    (prototype.parameters || []).forEach((p) => addTypeIfFound(context.scope, p.specifier));
    addTypeIfFound(context.scope, prototype.header.returnType);
    createFunctionDefinition(context.scope, prototype.header.name.identifier, n, n);
    return n;
  };
  var peg$f74 = function(w, rest) {
    return collapse(w, rest);
  };
  var peg$f75 = function(a, x, cc) {
    return xnil(x, cc);
  };
  var peg$f76 = function(a, d) {
    return xnil(a, d.flat());
  };
  var peg$f77 = function(i) {
    return i;
  };
  var peg$f78 = function(_) {
    return _;
  };
  var peg$currPos = 0;
  var peg$savedPos = 0;
  var peg$posDetailsCache = [{ line: 1, column: 1 }];
  var peg$maxFailPos = 0;
  var peg$maxFailExpected = [];
  var peg$silentFails = 0;
  var peg$resultsCache = {};
  var peg$result;
  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error(`Can't start parsing from rule "` + options.startRule + '".');
    }
    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }
  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }
  function offset() {
    return peg$savedPos;
  }
  function range() {
    return {
      source: peg$source,
      start: peg$savedPos,
      end: peg$currPos
    };
  }
  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }
  function expected(description, location2) {
    location2 = location2 !== void 0 ? location2 : peg$computeLocation(peg$savedPos, peg$currPos);
    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location2
    );
  }
  function error(message, location2) {
    location2 = location2 !== void 0 ? location2 : peg$computeLocation(peg$savedPos, peg$currPos);
    throw peg$buildSimpleError(message, location2);
  }
  function peg$literalExpectation(text2, ignoreCase) {
    return { type: "literal", text: text2, ignoreCase };
  }
  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts, inverted, ignoreCase };
  }
  function peg$anyExpectation() {
    return { type: "any" };
  }
  function peg$endExpectation() {
    return { type: "end" };
  }
  function peg$otherExpectation(description) {
    return { type: "other", description };
  }
  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos];
    var p;
    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }
      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };
      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }
        p++;
      }
      peg$posDetailsCache[pos] = details;
      return details;
    }
  }
  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos);
    var endPosDetails = peg$computePosDetails(endPos);
    return {
      source: peg$source,
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }
  function peg$fail(expected2) {
    if (peg$currPos < peg$maxFailPos) {
      return;
    }
    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }
    peg$maxFailExpected.push(expected2);
  }
  function peg$buildSimpleError(message, location2) {
    return new peg$SyntaxError(message, null, null, location2);
  }
  function peg$buildStructuredError(expected2, found, location2) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected2, found),
      expected2,
      found,
      location2
    );
  }
  function peg$parsestart() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 0;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$parsetranslation_unit();
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f0(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseATTRIBUTE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 1;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c0) {
      s1 = peg$c0;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e0);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseVARYING() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 2;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c1) {
      s1 = peg$c1;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e1);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCONST() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 3;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c2) {
      s1 = peg$c2;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e2);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseBOOL() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 4;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c3) {
      s1 = peg$c3;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e3);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseFLOAT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 5;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c4) {
      s1 = peg$c4;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e4);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDOUBLE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 6;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c5) {
      s1 = peg$c5;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e5);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseINT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 7;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c6) {
      s1 = peg$c6;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e6);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUINT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 8;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c7) {
      s1 = peg$c7;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e7);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseBREAK() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 9;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c8) {
      s1 = peg$c8;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e8);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCONTINUE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 10;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c9) {
      s1 = peg$c9;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e9);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDO() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 11;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c10) {
      s1 = peg$c10;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e10);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseELSE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 12;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c11) {
      s1 = peg$c11;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e11);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseFOR() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 13;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c12) {
      s1 = peg$c12;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e12);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIF() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 14;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c13) {
      s1 = peg$c13;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e13);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDISCARD() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 15;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c14) {
      s1 = peg$c14;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e14);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRETURN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 16;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c15) {
      s1 = peg$c15;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e15);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSWITCH() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 17;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c16) {
      s1 = peg$c16;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e16);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCASE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 18;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c17) {
      s1 = peg$c17;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e17);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDEFAULT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 19;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c18) {
      s1 = peg$c18;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e18);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSUBROUTINE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 20;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c19) {
      s1 = peg$c19;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e19);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseBVEC2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 21;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c20) {
      s1 = peg$c20;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e20);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseBVEC3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 22;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c21) {
      s1 = peg$c21;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e21);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseBVEC4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 23;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c22) {
      s1 = peg$c22;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e22);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIVEC2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 24;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c23) {
      s1 = peg$c23;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e23);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIVEC3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 25;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c24) {
      s1 = peg$c24;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e24);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIVEC4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 26;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c25) {
      s1 = peg$c25;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e25);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUVEC2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 27;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c26) {
      s1 = peg$c26;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e26);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUVEC3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 28;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c27) {
      s1 = peg$c27;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e27);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUVEC4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 29;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c28) {
      s1 = peg$c28;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e28);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseVEC2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 30;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c29) {
      s1 = peg$c29;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e29);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseVEC3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 31;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c30) {
      s1 = peg$c30;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e30);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseVEC4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 32;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c31) {
      s1 = peg$c31;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e31);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 33;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c32) {
      s1 = peg$c32;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e32);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 34;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c33) {
      s1 = peg$c33;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e33);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 35;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c34) {
      s1 = peg$c34;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e34);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCENTROID() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 36;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c35) {
      s1 = peg$c35;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e35);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 37;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c36) {
      s1 = peg$c36;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e36);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseOUT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 38;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c37) {
      s1 = peg$c37;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e37);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseINOUT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 39;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c38) {
      s1 = peg$c38;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e38);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUNIFORM() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 40;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c39) {
      s1 = peg$c39;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e39);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsePATCH() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 41;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c40) {
      s1 = peg$c40;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e40);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 42;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c41) {
      s1 = peg$c41;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e41);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseBUFFER() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 43;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c42) {
      s1 = peg$c42;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e42);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSHARED() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 44;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c43) {
      s1 = peg$c43;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e43);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCOHERENT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 45;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c44) {
      s1 = peg$c44;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e44);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseVOLATILE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 46;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c45) {
      s1 = peg$c45;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e45);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRESTRICT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 47;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c46) {
      s1 = peg$c46;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e46);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseREADONLY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 48;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c47) {
      s1 = peg$c47;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e47);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseWRITEONLY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 49;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c48) {
      s1 = peg$c48;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e48);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDVEC2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 50;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c49) {
      s1 = peg$c49;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e49);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDVEC3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 51;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c50) {
      s1 = peg$c50;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e50);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDVEC4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 52;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c51) {
      s1 = peg$c51;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e51);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 53;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c52) {
      s1 = peg$c52;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e52);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 54;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c53) {
      s1 = peg$c53;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e53);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 55;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c54) {
      s1 = peg$c54;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e54);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseNOPERSPECTIVE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 56;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 13) === peg$c55) {
      s1 = peg$c55;
      peg$currPos += 13;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e55);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseFLAT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 57;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c56) {
      s1 = peg$c56;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e56);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSMOOTH() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 58;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c57) {
      s1 = peg$c57;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e57);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLAYOUT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 59;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c58) {
      s1 = peg$c58;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e58);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT2X2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 60;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c59) {
      s1 = peg$c59;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e59);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT2X3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 61;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c60) {
      s1 = peg$c60;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e60);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT2X4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 62;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c61) {
      s1 = peg$c61;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e61);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT3X2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 63;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c62) {
      s1 = peg$c62;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e62);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT3X3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 64;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c63) {
      s1 = peg$c63;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e63);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT3X4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 65;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c64) {
      s1 = peg$c64;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e64);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT4X2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 66;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c65) {
      s1 = peg$c65;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e65);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT4X3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 67;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c66) {
      s1 = peg$c66;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e66);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMAT4X4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 68;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c67) {
      s1 = peg$c67;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e67);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT2X2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 69;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c68) {
      s1 = peg$c68;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e68);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT2X3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 70;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c69) {
      s1 = peg$c69;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e69);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT2X4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 71;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c70) {
      s1 = peg$c70;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e70);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT3X2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 72;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c71) {
      s1 = peg$c71;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e71);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT3X3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 73;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c72) {
      s1 = peg$c72;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e72);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT3X4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 74;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c73) {
      s1 = peg$c73;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e73);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT4X2() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 75;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c74) {
      s1 = peg$c74;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e74);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT4X3() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 76;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c75) {
      s1 = peg$c75;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e75);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDMAT4X4() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 77;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c76) {
      s1 = peg$c76;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e76);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseATOMIC_UINT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 78;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 11) === peg$c77) {
      s1 = peg$c77;
      peg$currPos += 11;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e77);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER1D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 79;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c78) {
      s1 = peg$c78;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e78);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER2D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 80;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c79) {
      s1 = peg$c79;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e79);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER3D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 81;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c80) {
      s1 = peg$c80;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e80);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLERCUBE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 82;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 11) === peg$c81) {
      s1 = peg$c81;
      peg$currPos += 11;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e81);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER1DSHADOW() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 83;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c82) {
      s1 = peg$c82;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e82);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER2DSHADOW() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 84;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c83) {
      s1 = peg$c83;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e83);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLERCUBESHADOW() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 85;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 17) === peg$c84) {
      s1 = peg$c84;
      peg$currPos += 17;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e84);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER1DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 86;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 14) === peg$c85) {
      s1 = peg$c85;
      peg$currPos += 14;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e85);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER2DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 87;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 14) === peg$c86) {
      s1 = peg$c86;
      peg$currPos += 14;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e86);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER1DARRAYSHADOW() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 88;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 20) === peg$c87) {
      s1 = peg$c87;
      peg$currPos += 20;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e87);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER2DARRAYSHADOW() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 89;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 20) === peg$c88) {
      s1 = peg$c88;
      peg$currPos += 20;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e88);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLER1D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 90;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c89) {
      s1 = peg$c89;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e89);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLER2D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 91;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c90) {
      s1 = peg$c90;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e90);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLER3D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 92;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c91) {
      s1 = peg$c91;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e91);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLERCUBE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 93;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c92) {
      s1 = peg$c92;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e92);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLER1DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 94;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c93) {
      s1 = peg$c93;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e93);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLER2DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 95;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c94) {
      s1 = peg$c94;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e94);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLER1D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 96;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c95) {
      s1 = peg$c95;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e95);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLER2D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 97;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c96) {
      s1 = peg$c96;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e96);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLER3D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 98;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c97) {
      s1 = peg$c97;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e97);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLERCUBE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 99;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c98) {
      s1 = peg$c98;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e98);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLER1DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 100;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c99) {
      s1 = peg$c99;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e99);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLER2DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 101;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c100) {
      s1 = peg$c100;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e100);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER2DRECT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 102;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 13) === peg$c101) {
      s1 = peg$c101;
      peg$currPos += 13;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e101);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER2DRECTSHADOW() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 103;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 19) === peg$c102) {
      s1 = peg$c102;
      peg$currPos += 19;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e102);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLER2DRECT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 104;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 14) === peg$c103) {
      s1 = peg$c103;
      peg$currPos += 14;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e103);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLER2DRECT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 105;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 14) === peg$c104) {
      s1 = peg$c104;
      peg$currPos += 14;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e104);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLERBUFFER() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 106;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 13) === peg$c105) {
      s1 = peg$c105;
      peg$currPos += 13;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e105);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLERBUFFER() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 107;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 14) === peg$c106) {
      s1 = peg$c106;
      peg$currPos += 14;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e106);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLERBUFFER() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 108;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 14) === peg$c107) {
      s1 = peg$c107;
      peg$currPos += 14;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e107);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLERCUBEARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 109;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 16) === peg$c108) {
      s1 = peg$c108;
      peg$currPos += 16;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e108);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLERCUBEARRAYSHADOW() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 110;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 22) === peg$c109) {
      s1 = peg$c109;
      peg$currPos += 22;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e109);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLERCUBEARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 111;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 17) === peg$c110) {
      s1 = peg$c110;
      peg$currPos += 17;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e110);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLERCUBEARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 112;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 17) === peg$c111) {
      s1 = peg$c111;
      peg$currPos += 17;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e111);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER2DMS() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 113;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 11) === peg$c112) {
      s1 = peg$c112;
      peg$currPos += 11;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e112);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLER2DMS() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 114;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c113) {
      s1 = peg$c113;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e113);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLER2DMS() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 115;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c114) {
      s1 = peg$c114;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e114);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSAMPLER2DMSARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 116;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 16) === peg$c115) {
      s1 = peg$c115;
      peg$currPos += 16;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e115);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseISAMPLER2DMSARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 117;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 17) === peg$c116) {
      s1 = peg$c116;
      peg$currPos += 17;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e116);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUSAMPLER2DMSARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 118;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 17) === peg$c117) {
      s1 = peg$c117;
      peg$currPos += 17;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e117);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGE1D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 119;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c118) {
      s1 = peg$c118;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e118);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGE1D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 120;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c119) {
      s1 = peg$c119;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e119);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGE1D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 121;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c120) {
      s1 = peg$c120;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e120);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGE2D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 122;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c121) {
      s1 = peg$c121;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e121);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGE2D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 123;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c122) {
      s1 = peg$c122;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e122);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGE2D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 124;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c123) {
      s1 = peg$c123;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e123);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGE3D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 125;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c124) {
      s1 = peg$c124;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e124);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGE3D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 126;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c125) {
      s1 = peg$c125;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e125);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGE3D() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 127;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c126) {
      s1 = peg$c126;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e126);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGE2DRECT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 128;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 11) === peg$c127) {
      s1 = peg$c127;
      peg$currPos += 11;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e127);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGE2DRECT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 129;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c128) {
      s1 = peg$c128;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e128);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGE2DRECT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 130;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c129) {
      s1 = peg$c129;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e129);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGECUBE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 131;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c130) {
      s1 = peg$c130;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e130);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGECUBE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 132;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c131) {
      s1 = peg$c131;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e131);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGECUBE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 133;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c132) {
      s1 = peg$c132;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e132);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGEBUFFER() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 134;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 11) === peg$c133) {
      s1 = peg$c133;
      peg$currPos += 11;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e133);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGEBUFFER() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 135;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c134) {
      s1 = peg$c134;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e134);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGEBUFFER() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 136;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c135) {
      s1 = peg$c135;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e135);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGE1DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 137;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c136) {
      s1 = peg$c136;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e136);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGE1DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 138;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 13) === peg$c137) {
      s1 = peg$c137;
      peg$currPos += 13;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e137);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGE1DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 139;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 13) === peg$c138) {
      s1 = peg$c138;
      peg$currPos += 13;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e138);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGE2DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 140;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 12) === peg$c139) {
      s1 = peg$c139;
      peg$currPos += 12;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e139);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGE2DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 141;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 13) === peg$c140) {
      s1 = peg$c140;
      peg$currPos += 13;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e140);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGE2DARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 142;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 13) === peg$c141) {
      s1 = peg$c141;
      peg$currPos += 13;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e141);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGECUBEARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 143;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 14) === peg$c142) {
      s1 = peg$c142;
      peg$currPos += 14;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e142);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGECUBEARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 144;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c143) {
      s1 = peg$c143;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e143);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGECUBEARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 145;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c144) {
      s1 = peg$c144;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e144);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGE2DMS() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 146;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c145) {
      s1 = peg$c145;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e145);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGE2DMS() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 147;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c146) {
      s1 = peg$c146;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e146);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGE2DMS() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 148;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 10) === peg$c147) {
      s1 = peg$c147;
      peg$currPos += 10;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e147);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIMAGE2DMSARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 149;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 13) === peg$c148) {
      s1 = peg$c148;
      peg$currPos += 13;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e148);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIIMAGE2DMSARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 150;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c149) {
      s1 = peg$c149;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e149);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUIMAGE2DMSARRAY() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 151;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 15) === peg$c150) {
      s1 = peg$c150;
      peg$currPos += 15;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e150);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSTRUCT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 152;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c151) {
      s1 = peg$c151;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e151);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseVOID() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 153;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c152) {
      s1 = peg$c152;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e152);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseWHILE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 154;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c153) {
      s1 = peg$c153;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e153);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseINVARIANT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 155;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c154) {
      s1 = peg$c154;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e154);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsePRECISE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 156;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c155) {
      s1 = peg$c155;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e155);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseHIGH_PRECISION() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 157;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c156) {
      s1 = peg$c156;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e156);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMEDIUM_PRECISION() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 158;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c157) {
      s1 = peg$c157;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e157);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLOW_PRECISION() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 159;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c158) {
      s1 = peg$c158;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e158);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsePRECISION() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 160;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 9) === peg$c159) {
      s1 = peg$c159;
      peg$currPos += 9;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e159);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseFLOATCONSTANT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 161;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsefloating_constant();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDOUBLECONSTANT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 162;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsefloating_constant();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f3(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseINTCONSTANT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 163;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseinteger_constant();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f4(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUINTCONSTANT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 164;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseinteger_constant();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f5(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseBOOLCONSTANT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 165;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c160) {
      s1 = peg$c160;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e160);
      }
    }
    if (s1 === peg$FAILED) {
      if (input.substr(peg$currPos, 5) === peg$c161) {
        s1 = peg$c161;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e161);
        }
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseterminal();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f6(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsekeyword() {
    var s0, s1;
    var key = peg$currPos * 306 + 166;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parseATTRIBUTE();
    if (s0 === peg$FAILED) {
      s0 = peg$parseVARYING();
      if (s0 === peg$FAILED) {
        s0 = peg$parseCONST();
        if (s0 === peg$FAILED) {
          s0 = peg$parseBOOL();
          if (s0 === peg$FAILED) {
            s0 = peg$parseFLOAT();
            if (s0 === peg$FAILED) {
              s0 = peg$parseDOUBLE();
              if (s0 === peg$FAILED) {
                s0 = peg$parseINT();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseUINT();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseBREAK();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseCONTINUE();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseDO();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseELSE();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseFOR();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseIF();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parseDISCARD();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parseRETURN();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parseSWITCH();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parseCASE();
                                      if (s0 === peg$FAILED) {
                                        s0 = peg$parseDEFAULT();
                                        if (s0 === peg$FAILED) {
                                          s0 = peg$parseSUBROUTINE();
                                          if (s0 === peg$FAILED) {
                                            s0 = peg$parseBVEC2();
                                            if (s0 === peg$FAILED) {
                                              s0 = peg$parseBVEC3();
                                              if (s0 === peg$FAILED) {
                                                s0 = peg$parseBVEC4();
                                                if (s0 === peg$FAILED) {
                                                  s0 = peg$parseIVEC2();
                                                  if (s0 === peg$FAILED) {
                                                    s0 = peg$parseIVEC3();
                                                    if (s0 === peg$FAILED) {
                                                      s0 = peg$parseIVEC4();
                                                      if (s0 === peg$FAILED) {
                                                        s0 = peg$parseUVEC2();
                                                        if (s0 === peg$FAILED) {
                                                          s0 = peg$parseUVEC3();
                                                          if (s0 === peg$FAILED) {
                                                            s0 = peg$parseUVEC4();
                                                            if (s0 === peg$FAILED) {
                                                              s0 = peg$parseVEC2();
                                                              if (s0 === peg$FAILED) {
                                                                s0 = peg$parseVEC3();
                                                                if (s0 === peg$FAILED) {
                                                                  s0 = peg$parseVEC4();
                                                                  if (s0 === peg$FAILED) {
                                                                    s0 = peg$parseMAT2();
                                                                    if (s0 === peg$FAILED) {
                                                                      s0 = peg$parseMAT3();
                                                                      if (s0 === peg$FAILED) {
                                                                        s0 = peg$parseMAT4();
                                                                        if (s0 === peg$FAILED) {
                                                                          s0 = peg$parseCENTROID();
                                                                          if (s0 === peg$FAILED) {
                                                                            s0 = peg$parseIN();
                                                                            if (s0 === peg$FAILED) {
                                                                              s0 = peg$parseOUT();
                                                                              if (s0 === peg$FAILED) {
                                                                                s0 = peg$parseINOUT();
                                                                                if (s0 === peg$FAILED) {
                                                                                  s0 = peg$parseUNIFORM();
                                                                                  if (s0 === peg$FAILED) {
                                                                                    s0 = peg$parsePATCH();
                                                                                    if (s0 === peg$FAILED) {
                                                                                      s0 = peg$parseSAMPLE();
                                                                                      if (s0 === peg$FAILED) {
                                                                                        s0 = peg$parseBUFFER();
                                                                                        if (s0 === peg$FAILED) {
                                                                                          s0 = peg$parseSHARED();
                                                                                          if (s0 === peg$FAILED) {
                                                                                            s0 = peg$parseCOHERENT();
                                                                                            if (s0 === peg$FAILED) {
                                                                                              s0 = peg$parseVOLATILE();
                                                                                              if (s0 === peg$FAILED) {
                                                                                                s0 = peg$parseRESTRICT();
                                                                                                if (s0 === peg$FAILED) {
                                                                                                  s0 = peg$parseREADONLY();
                                                                                                  if (s0 === peg$FAILED) {
                                                                                                    s0 = peg$parseWRITEONLY();
                                                                                                    if (s0 === peg$FAILED) {
                                                                                                      s0 = peg$parseDVEC2();
                                                                                                      if (s0 === peg$FAILED) {
                                                                                                        s0 = peg$parseDVEC3();
                                                                                                        if (s0 === peg$FAILED) {
                                                                                                          s0 = peg$parseDVEC4();
                                                                                                          if (s0 === peg$FAILED) {
                                                                                                            s0 = peg$parseDMAT2();
                                                                                                            if (s0 === peg$FAILED) {
                                                                                                              s0 = peg$parseDMAT3();
                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                s0 = peg$parseDMAT4();
                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                  s0 = peg$parseNOPERSPECTIVE();
                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                    s0 = peg$parseFLAT();
                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                      s0 = peg$parseSMOOTH();
                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                        s0 = peg$parseLAYOUT();
                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                          s0 = peg$parseMAT2X2();
                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                            s0 = peg$parseMAT2X3();
                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                              s0 = peg$parseMAT2X4();
                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                s0 = peg$parseMAT3X2();
                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                  s0 = peg$parseMAT3X3();
                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                    s0 = peg$parseMAT3X4();
                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                      s0 = peg$parseMAT4X2();
                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                        s0 = peg$parseMAT4X3();
                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                          s0 = peg$parseMAT4X4();
                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                            s0 = peg$parseDMAT2X2();
                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                              s0 = peg$parseDMAT2X3();
                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                s0 = peg$parseDMAT2X4();
                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                  s0 = peg$parseDMAT3X2();
                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                    s0 = peg$parseDMAT3X3();
                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                      s0 = peg$parseDMAT3X4();
                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                        s0 = peg$parseDMAT4X2();
                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                          s0 = peg$parseDMAT4X3();
                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                            s0 = peg$parseDMAT4X4();
                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                              s0 = peg$parseATOMIC_UINT();
                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                s0 = peg$parseSAMPLER1D();
                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                  s0 = peg$parseSAMPLER2D();
                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                    s0 = peg$parseSAMPLER3D();
                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                      s0 = peg$parseSAMPLERCUBE();
                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                        s0 = peg$parseSAMPLER1DSHADOW();
                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                          s0 = peg$parseSAMPLER2DSHADOW();
                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                            s0 = peg$parseSAMPLERCUBESHADOW();
                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                              s0 = peg$parseSAMPLER1DARRAY();
                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                s0 = peg$parseSAMPLER2DARRAY();
                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                  s0 = peg$parseSAMPLER1DARRAYSHADOW();
                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                    s0 = peg$parseSAMPLER2DARRAYSHADOW();
                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                      s0 = peg$parseISAMPLER1D();
                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                        s0 = peg$parseISAMPLER2D();
                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                          s0 = peg$parseISAMPLER3D();
                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                            s0 = peg$parseISAMPLERCUBE();
                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                              s0 = peg$parseISAMPLER1DARRAY();
                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                s0 = peg$parseISAMPLER2DARRAY();
                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                  s0 = peg$parseUSAMPLER1D();
                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                    s0 = peg$parseUSAMPLER2D();
                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                      s0 = peg$parseUSAMPLER3D();
                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                        s0 = peg$parseUSAMPLERCUBE();
                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                          s0 = peg$parseUSAMPLER1DARRAY();
                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                            s0 = peg$parseUSAMPLER2DARRAY();
                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                              s0 = peg$parseSAMPLER2DRECT();
                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                s0 = peg$parseSAMPLER2DRECTSHADOW();
                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                  s0 = peg$parseISAMPLER2DRECT();
                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                    s0 = peg$parseUSAMPLER2DRECT();
                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                      s0 = peg$parseSAMPLERBUFFER();
                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                        s0 = peg$parseISAMPLERBUFFER();
                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                          s0 = peg$parseUSAMPLERBUFFER();
                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                            s0 = peg$parseSAMPLERCUBEARRAY();
                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                              s0 = peg$parseSAMPLERCUBEARRAYSHADOW();
                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                s0 = peg$parseISAMPLERCUBEARRAY();
                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                  s0 = peg$parseUSAMPLERCUBEARRAY();
                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                    s0 = peg$parseSAMPLER2DMS();
                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                      s0 = peg$parseISAMPLER2DMS();
                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                        s0 = peg$parseUSAMPLER2DMS();
                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                          s0 = peg$parseSAMPLER2DMSARRAY();
                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                            s0 = peg$parseISAMPLER2DMSARRAY();
                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                              s0 = peg$parseUSAMPLER2DMSARRAY();
                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                s0 = peg$parseIMAGE1D();
                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                  s0 = peg$parseIIMAGE1D();
                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                    s0 = peg$parseUIMAGE1D();
                                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                      s0 = peg$parseIMAGE2D();
                                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                        s0 = peg$parseIIMAGE2D();
                                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                          s0 = peg$parseUIMAGE2D();
                                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                            s0 = peg$parseIMAGE3D();
                                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                              s0 = peg$parseIIMAGE3D();
                                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                s0 = peg$parseUIMAGE3D();
                                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                  s0 = peg$parseIMAGE2DRECT();
                                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                    s0 = peg$parseIIMAGE2DRECT();
                                                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                      s0 = peg$parseUIMAGE2DRECT();
                                                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                        s0 = peg$parseIMAGECUBE();
                                                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                          s0 = peg$parseIIMAGECUBE();
                                                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                            s0 = peg$parseUIMAGECUBE();
                                                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                              s0 = peg$parseIMAGEBUFFER();
                                                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                s0 = peg$parseIIMAGEBUFFER();
                                                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                  s0 = peg$parseUIMAGEBUFFER();
                                                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                    s0 = peg$parseIMAGE1DARRAY();
                                                                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                      s0 = peg$parseIIMAGE1DARRAY();
                                                                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                        s0 = peg$parseUIMAGE1DARRAY();
                                                                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                          s0 = peg$parseIMAGE2DARRAY();
                                                                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                            s0 = peg$parseIIMAGE2DARRAY();
                                                                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                              s0 = peg$parseUIMAGE2DARRAY();
                                                                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                s0 = peg$parseIMAGECUBEARRAY();
                                                                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                  s0 = peg$parseIIMAGECUBEARRAY();
                                                                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                    s0 = peg$parseUIMAGECUBEARRAY();
                                                                                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                      s0 = peg$parseIMAGE2DMS();
                                                                                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                        s0 = peg$parseIIMAGE2DMS();
                                                                                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                          s0 = peg$parseUIMAGE2DMS();
                                                                                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                            s0 = peg$parseIMAGE2DMSARRAY();
                                                                                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                              s0 = peg$parseIIMAGE2DMSARRAY();
                                                                                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                s0 = peg$parseUIMAGE2DMSARRAY();
                                                                                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                  s0 = peg$parseSTRUCT();
                                                                                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                    s0 = peg$parseVOID();
                                                                                                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                      s0 = peg$parseWHILE();
                                                                                                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                        s0 = peg$parseINVARIANT();
                                                                                                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                          s0 = peg$parsePRECISE();
                                                                                                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                            s0 = peg$parseHIGH_PRECISION();
                                                                                                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                              s0 = peg$parseMEDIUM_PRECISION();
                                                                                                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                                s0 = peg$parseLOW_PRECISION();
                                                                                                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                                                                                  s0 = peg$parsePRECISION();
                                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                  }
                                                                                                                                                                                                                }
                                                                                                                                                                                                              }
                                                                                                                                                                                                            }
                                                                                                                                                                                                          }
                                                                                                                                                                                                        }
                                                                                                                                                                                                      }
                                                                                                                                                                                                    }
                                                                                                                                                                                                  }
                                                                                                                                                                                                }
                                                                                                                                                                                              }
                                                                                                                                                                                            }
                                                                                                                                                                                          }
                                                                                                                                                                                        }
                                                                                                                                                                                      }
                                                                                                                                                                                    }
                                                                                                                                                                                  }
                                                                                                                                                                                }
                                                                                                                                                                              }
                                                                                                                                                                            }
                                                                                                                                                                          }
                                                                                                                                                                        }
                                                                                                                                                                      }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e162);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLEFT_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 167;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c162) {
      s1 = peg$c162;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e163);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRIGHT_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 168;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c163) {
      s1 = peg$c163;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e164);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseINC_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 169;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c164) {
      s1 = peg$c164;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e165);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDEC_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 170;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c165) {
      s1 = peg$c165;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e166);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLE_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 171;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c166) {
      s1 = peg$c166;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e167);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseGE_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 172;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c167) {
      s1 = peg$c167;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e168);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseEQ_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 173;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c168) {
      s1 = peg$c168;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e169);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseNE_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 174;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c169) {
      s1 = peg$c169;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e170);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseAND_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 175;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c170) {
      s1 = peg$c170;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e171);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseOR_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 176;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c171) {
      s1 = peg$c171;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e172);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseXOR_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 177;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c172) {
      s1 = peg$c172;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e173);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMUL_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 178;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c173) {
      s1 = peg$c173;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e174);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDIV_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 179;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c174) {
      s1 = peg$c174;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e175);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseADD_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 180;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c175) {
      s1 = peg$c175;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e176);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseMOD_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 181;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c176) {
      s1 = peg$c176;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e177);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLEFT_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 182;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c177) {
      s1 = peg$c177;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e178);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRIGHT_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 183;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c178) {
      s1 = peg$c178;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e179);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseAND_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 184;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c179) {
      s1 = peg$c179;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e180);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseXOR_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 185;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c180) {
      s1 = peg$c180;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e181);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseOR_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 186;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c181) {
      s1 = peg$c181;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e182);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSUB_ASSIGN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 187;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c182) {
      s1 = peg$c182;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e183);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLEFT_PAREN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 188;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c183;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e184);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRIGHT_PAREN() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 189;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 41) {
      s1 = peg$c184;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e185);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLEFT_BRACKET() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 190;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      s1 = peg$c185;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e186);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRIGHT_BRACKET() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 191;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 93) {
      s1 = peg$c186;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e187);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLEFT_BRACE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 192;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 123) {
      s1 = peg$c187;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e188);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRIGHT_BRACE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 193;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 125) {
      s1 = peg$c188;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e189);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDOT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 194;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      s1 = peg$c189;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e190);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCOMMA() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 195;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 44) {
      s1 = peg$c190;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e191);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCOLON() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 196;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 58) {
      s1 = peg$c191;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e192);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseEQUAL() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 197;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 61) {
      s1 = peg$c192;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e193);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSEMICOLON() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 198;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 59) {
      s1 = peg$c193;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e194);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseBANG() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 199;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 33) {
      s1 = peg$c194;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e195);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDASH() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 200;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 45) {
      s1 = peg$c195;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e196);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseTILDE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 201;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 126) {
      s1 = peg$c196;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e197);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsePLUS() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 202;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 43) {
      s1 = peg$c197;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e198);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSTAR() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 203;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 42) {
      s1 = peg$c198;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e199);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSLASH() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 204;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 47) {
      s1 = peg$c199;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e200);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsePERCENT() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 205;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 37) {
      s1 = peg$c200;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e201);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLEFT_ANGLE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 206;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 60) {
      s1 = peg$c201;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e202);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRIGHT_ANGLE() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 207;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 62) {
      s1 = peg$c202;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e203);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseVERTICAL_BAR() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 208;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 124) {
      s1 = peg$c203;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e204);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCARET() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 209;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 94) {
      s1 = peg$c204;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e205);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseAMPERSAND() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 210;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 38) {
      s1 = peg$c205;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e206);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseQUESTION() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 211;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 63) {
      s1 = peg$c206;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e207);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f7(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIDENTIFIER() {
    var s0, s1, s2, s3, s4, s5, s6;
    var key = peg$currPos * 306 + 212;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    s2 = peg$parsekeyword();
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$currPos;
      if (peg$r0.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e208);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = [];
        if (peg$r1.test(input.charAt(peg$currPos))) {
          s6 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e209);
          }
        }
        while (s6 !== peg$FAILED) {
          s5.push(s6);
          if (peg$r1.test(input.charAt(peg$currPos))) {
            s6 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e209);
            }
          }
        }
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        s2 = input.substring(s2, peg$currPos);
      } else {
        s2 = s3;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        peg$savedPos = s0;
        s0 = peg$f8(s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseTYPE_NAME() {
    var s0, s1, s2, s3, s4, s5, s6;
    var key = peg$currPos * 306 + 213;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    s2 = peg$parsekeyword();
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$currPos;
      if (peg$r0.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e208);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = [];
        if (peg$r1.test(input.charAt(peg$currPos))) {
          s6 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e209);
          }
        }
        while (s6 !== peg$FAILED) {
          s5.push(s6);
          if (peg$r1.test(input.charAt(peg$currPos))) {
            s6 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e209);
            }
          }
        }
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        s2 = input.substring(s2, peg$currPos);
      } else {
        s2 = s3;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        peg$savedPos = s0;
        s0 = peg$f9(s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinteger_constant() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 214;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parsehexadecimal_constant();
    if (s2 !== peg$FAILED) {
      s3 = peg$parseinteger_suffix();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s2 = [s2, s3];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parsedecimal_constant();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseinteger_suffix();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$parseoctal_constant();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinteger_suffix();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinteger_suffix() {
    var s0;
    var key = peg$currPos * 306 + 215;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    if (peg$r2.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e210);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsedecimal_constant() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 216;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    if (peg$r3.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e211);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      s4 = peg$parsedigit();
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parsedigit();
      }
      s2 = [s2, s3];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseoctal_constant() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 217;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 48) {
      s1 = peg$c207;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e212);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      if (peg$r4.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e213);
        }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$r4.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e213);
          }
        }
      }
      s1 = [s1, s2];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsehexadecimal_constant() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 218;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 48) {
      s1 = peg$c207;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e212);
      }
    }
    if (s1 !== peg$FAILED) {
      if (peg$r5.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e214);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        if (peg$r6.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e215);
          }
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$r6.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e215);
            }
          }
        }
        s1 = [s1, s2, s3];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsedigit() {
    var s0;
    var key = peg$currPos * 306 + 219;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    if (peg$r7.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e216);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefloating_constant() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 220;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parsefractional_constant();
    if (s2 !== peg$FAILED) {
      s3 = peg$parseexponent_part();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parsefloating_suffix();
      if (s4 === peg$FAILED) {
        s4 = null;
      }
      s2 = [s2, s3, s4];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parsedigit_sequence();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseexponent_part();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsefloating_suffix();
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          s2 = [s2, s3, s4];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefractional_constant() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 221;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parsedigit_sequence();
    if (s2 === peg$FAILED) {
      s2 = null;
    }
    if (input.charCodeAt(peg$currPos) === 46) {
      s3 = peg$c189;
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e190);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parsedigit_sequence();
      if (s4 === peg$FAILED) {
        s4 = null;
      }
      s2 = [s2, s3, s4];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseexponent_part() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 222;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$currPos;
    if (peg$r8.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e218);
      }
    }
    if (s2 !== peg$FAILED) {
      if (peg$r9.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e219);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parsedigit_sequence();
      if (s4 !== peg$FAILED) {
        s2 = [s2, s3, s4];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e217);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsedigit_sequence() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 223;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsedigit();
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsedigit();
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefloating_suffix() {
    var s0;
    var key = peg$currPos * 306 + 224;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    if (peg$r10.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e220);
      }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c208) {
        s0 = peg$c208;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e221);
        }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c209) {
          s0 = peg$c209;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e222);
          }
        }
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseprimary_expression() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 225;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parseFLOATCONSTANT();
    if (s0 === peg$FAILED) {
      s0 = peg$parseINTCONSTANT();
      if (s0 === peg$FAILED) {
        s0 = peg$parseUINTCONSTANT();
        if (s0 === peg$FAILED) {
          s0 = peg$parseBOOLCONSTANT();
          if (s0 === peg$FAILED) {
            s0 = peg$parseDOUBLECONSTANT();
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseLEFT_PAREN();
              if (s1 !== peg$FAILED) {
                s2 = peg$parseexpression();
                if (s2 !== peg$FAILED) {
                  s3 = peg$parseRIGHT_PAREN();
                  if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f10(s1, s2, s3);
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseIDENTIFIER();
                if (s1 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$f11(s1);
                }
                s0 = s1;
              }
            }
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e223);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsepostfix_expression() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 226;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parsefunction_call();
    if (s2 !== peg$FAILED) {
      s3 = [];
      s4 = peg$parsepostfix_expression_suffix();
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parsepostfix_expression_suffix();
      }
      s2 = [s2, s3];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 === peg$FAILED) {
      s1 = peg$currPos;
      s2 = peg$parseprimary_expression();
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parsepostfix_expression_suffix();
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parsepostfix_expression_suffix();
        }
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f12(s1);
    }
    s0 = s1;
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsepostfix_expression_suffix() {
    var s0;
    var key = peg$currPos * 306 + 227;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parseinteger_index();
    if (s0 === peg$FAILED) {
      s0 = peg$parsefield_selection();
      if (s0 === peg$FAILED) {
        s0 = peg$parseINC_OP();
        if (s0 === peg$FAILED) {
          s0 = peg$parseDEC_OP();
        }
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinteger_index() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 228;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseLEFT_BRACKET();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseexpression();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseRIGHT_BRACKET();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f13(s1, s2, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefield_selection() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 229;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseDOT();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseIDENTIFIER();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f14(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_call() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 230;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsefunction_identifier();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsefunction_arguments();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = peg$parseRIGHT_PAREN();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f15(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_arguments() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 231;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseVOID();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f16(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseassignment_expression();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseassignment_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseCOMMA();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseassignment_expression();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        peg$savedPos = s0;
        s0 = peg$f17(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_identifier() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 232;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parsechained_function_call();
    if (s2 !== peg$FAILED) {
      s3 = peg$parsefunction_suffix();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseLEFT_PAREN();
        if (s4 !== peg$FAILED) {
          peg$savedPos = s1;
          s1 = peg$f18(s2, s3, s4);
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 === peg$FAILED) {
      s1 = peg$currPos;
      s2 = peg$parsetype_specifier();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsefunction_suffix();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        s4 = peg$parseLEFT_PAREN();
        if (s4 !== peg$FAILED) {
          peg$savedPos = s1;
          s1 = peg$f18(s2, s3, s4);
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f19(s1);
    }
    s0 = s1;
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_suffix() {
    var s0;
    var key = peg$currPos * 306 + 233;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parseinteger_index();
    if (s0 === peg$FAILED) {
      s0 = peg$parsefield_selection();
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsechained_function_call() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 234;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsetype_specifier();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseLEFT_PAREN();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsefunction_arguments();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        s4 = peg$parseRIGHT_PAREN();
        if (s4 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f20(s1, s2, s3, s4);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseunary_expression() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 235;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parsepostfix_expression();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseINC_OP();
      if (s1 === peg$FAILED) {
        s1 = peg$parseDEC_OP();
        if (s1 === peg$FAILED) {
          s1 = peg$parsePLUS();
          if (s1 === peg$FAILED) {
            s1 = peg$parseDASH();
            if (s1 === peg$FAILED) {
              s1 = peg$parseBANG();
              if (s1 === peg$FAILED) {
                s1 = peg$parseTILDE();
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseunary_expression();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f21(s1, s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e224);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsemultiplicative_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 236;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseunary_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseSTAR();
      if (s4 === peg$FAILED) {
        s4 = peg$parseSLASH();
        if (s4 === peg$FAILED) {
          s4 = peg$parsePERCENT();
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parseunary_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseSTAR();
        if (s4 === peg$FAILED) {
          s4 = peg$parseSLASH();
          if (s4 === peg$FAILED) {
            s4 = peg$parsePERCENT();
          }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseunary_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseadditive_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 237;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsemultiplicative_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parsePLUS();
      if (s4 === peg$FAILED) {
        s4 = peg$parseDASH();
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parsemultiplicative_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parsePLUS();
        if (s4 === peg$FAILED) {
          s4 = peg$parseDASH();
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsemultiplicative_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseshift_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 238;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseadditive_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseRIGHT_OP();
      if (s4 === peg$FAILED) {
        s4 = peg$parseLEFT_OP();
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parseadditive_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseRIGHT_OP();
        if (s4 === peg$FAILED) {
          s4 = peg$parseLEFT_OP();
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseadditive_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parserelational_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 239;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseshift_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseLE_OP();
      if (s4 === peg$FAILED) {
        s4 = peg$parseGE_OP();
        if (s4 === peg$FAILED) {
          s4 = peg$parseLEFT_ANGLE();
          if (s4 === peg$FAILED) {
            s4 = peg$parseRIGHT_ANGLE();
          }
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parseshift_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseLE_OP();
        if (s4 === peg$FAILED) {
          s4 = peg$parseGE_OP();
          if (s4 === peg$FAILED) {
            s4 = peg$parseLEFT_ANGLE();
            if (s4 === peg$FAILED) {
              s4 = peg$parseRIGHT_ANGLE();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseshift_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseequality_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 240;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parserelational_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseEQ_OP();
      if (s4 === peg$FAILED) {
        s4 = peg$parseNE_OP();
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parserelational_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseEQ_OP();
        if (s4 === peg$FAILED) {
          s4 = peg$parseNE_OP();
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parserelational_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e225);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseand_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 241;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseequality_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseAMPERSAND();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseequality_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseAMPERSAND();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseequality_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e226);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseexclusive_or_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 242;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseand_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseCARET();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseand_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseCARET();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseand_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinclusive_or_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 243;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseexclusive_or_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseVERTICAL_BAR();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseexclusive_or_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseVERTICAL_BAR();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseexclusive_or_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parselogical_and_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 244;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseinclusive_or_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseAND_OP();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseinclusive_or_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseAND_OP();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseinclusive_or_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parselogical_xor_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 245;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parselogical_and_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseXOR_OP();
      if (s4 !== peg$FAILED) {
        s5 = peg$parselogical_and_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseXOR_OP();
        if (s4 !== peg$FAILED) {
          s5 = peg$parselogical_and_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parselogical_or_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 246;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parselogical_xor_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseOR_OP();
      if (s4 !== peg$FAILED) {
        s5 = peg$parselogical_xor_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseOR_OP();
        if (s4 !== peg$FAILED) {
          s5 = peg$parselogical_xor_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseternary_expression() {
    var s0, s1, s2, s3, s4, s5, s6;
    var key = peg$currPos * 306 + 247;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parselogical_or_expression();
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$parseQUESTION();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseexpression();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseCOLON();
          if (s5 !== peg$FAILED) {
            s6 = peg$parseassignment_expression();
            if (s6 !== peg$FAILED) {
              peg$savedPos = s2;
              s2 = peg$f23(s1, s3, s4, s5, s6);
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f24(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseassignment_expression() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 248;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseunary_expression();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseassignment_operator();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseassignment_expression();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f25(s1, s2, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseternary_expression();
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseassignment_operator() {
    var s0, s1;
    var key = peg$currPos * 306 + 249;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parseEQUAL();
    if (s0 === peg$FAILED) {
      s0 = peg$parseMUL_ASSIGN();
      if (s0 === peg$FAILED) {
        s0 = peg$parseDIV_ASSIGN();
        if (s0 === peg$FAILED) {
          s0 = peg$parseMOD_ASSIGN();
          if (s0 === peg$FAILED) {
            s0 = peg$parseADD_ASSIGN();
            if (s0 === peg$FAILED) {
              s0 = peg$parseSUB_ASSIGN();
              if (s0 === peg$FAILED) {
                s0 = peg$parseLEFT_ASSIGN();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseRIGHT_ASSIGN();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseAND_ASSIGN();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseXOR_ASSIGN();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseOR_ASSIGN();
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e227);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseexpression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 250;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseassignment_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseCOMMA();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseassignment_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseassignment_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f22(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e228);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsedeclaration_statement() {
    var s0, s1;
    var key = peg$currPos * 306 + 251;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseprecision_declarator_statement();
    if (s1 === peg$FAILED) {
      s1 = peg$parseinterface_declarator_statement();
      if (s1 === peg$FAILED) {
        s1 = peg$parsequalifier_declarator_statement();
        if (s1 === peg$FAILED) {
          s1 = peg$parseinit_declarator_list_statement();
        }
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f26(s1);
    }
    s0 = s1;
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsequalifier_declarator_statement() {
    var s0, s1, s2, s3, s4, s5, s6;
    var key = peg$currPos * 306 + 252;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsetype_qualifiers();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseIDENTIFIER();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = [];
      s4 = peg$currPos;
      s5 = peg$parseCOMMA();
      if (s5 !== peg$FAILED) {
        s6 = peg$parseIDENTIFIER();
        if (s6 !== peg$FAILED) {
          s5 = [s5, s6];
          s4 = s5;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$currPos;
        s5 = peg$parseCOMMA();
        if (s5 !== peg$FAILED) {
          s6 = peg$parseIDENTIFIER();
          if (s6 !== peg$FAILED) {
            s5 = [s5, s6];
            s4 = s5;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      }
      s4 = peg$parseSEMICOLON();
      if (s4 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f27(s1, s2, s3, s4);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinterface_declarator_statement() {
    var s0, s1, s2, s3, s4, s5, s6, s7;
    var key = peg$currPos * 306 + 253;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsetype_qualifiers();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseIDENTIFIER();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseLEFT_BRACE();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsestruct_declaration_list();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseRIGHT_BRACE();
            if (s5 !== peg$FAILED) {
              s6 = peg$parsequantified_identifier();
              if (s6 === peg$FAILED) {
                s6 = null;
              }
              s7 = peg$parseSEMICOLON();
              if (s7 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f28(s1, s2, s3, s4, s5, s6, s7);
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseprecision_declarator_statement() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 254;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsePRECISION();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseprecision_qualifier();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsetype_specifier();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseSEMICOLON();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f29(s1, s2, s3, s4);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e229);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_prototype_new_scope() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 255;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsefunction_header_new_scope();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsefunction_parameters();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = peg$parseRIGHT_PAREN();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f30(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e230);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_header_new_scope() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 256;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsefully_specified_type();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseIDENTIFIER();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseLEFT_PAREN();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f31(s1, s2, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e231);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_prototype_no_new_scope() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 257;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsefunction_header_no_new_scope();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsefunction_parameters();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = peg$parseRIGHT_PAREN();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f32(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e232);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_header_no_new_scope() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 258;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsefully_specified_type();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseIDENTIFIER();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseLEFT_PAREN();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f33(s1, s2, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e233);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_parameters() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 259;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseparameter_declaration();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseCOMMA();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseparameter_declaration();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseparameter_declaration();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f34(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e234);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseparameter_declaration() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 260;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parseparameter_qualifier();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parseparameter_qualifier();
    }
    s2 = peg$parsetype_specifier();
    if (s2 !== peg$FAILED) {
      s3 = peg$currPos;
      s4 = peg$parseIDENTIFIER();
      if (s4 !== peg$FAILED) {
        s5 = peg$parsearray_specifiers();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f35(s1, s2, s3);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e235);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseparameter_qualifier() {
    var s0;
    var key = peg$currPos * 306 + 261;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parseCONST();
    if (s0 === peg$FAILED) {
      s0 = peg$parseIN();
      if (s0 === peg$FAILED) {
        s0 = peg$parseOUT();
        if (s0 === peg$FAILED) {
          s0 = peg$parseINOUT();
          if (s0 === peg$FAILED) {
            s0 = peg$parsememory_qualifier();
            if (s0 === peg$FAILED) {
              s0 = peg$parseprecision_qualifier();
            }
          }
        }
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsememory_qualifier() {
    var s0;
    var key = peg$currPos * 306 + 262;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parseCOHERENT();
    if (s0 === peg$FAILED) {
      s0 = peg$parseVOLATILE();
      if (s0 === peg$FAILED) {
        s0 = peg$parseRESTRICT();
        if (s0 === peg$FAILED) {
          s0 = peg$parseREADONLY();
          if (s0 === peg$FAILED) {
            s0 = peg$parseWRITEONLY();
          }
        }
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinit_declarator_list_statement() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 263;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseinitial_declaration();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseCOMMA();
      if (s4 !== peg$FAILED) {
        s5 = peg$parsesubsequent_declaration();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseCOMMA();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsesubsequent_declaration();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      s3 = peg$parseSEMICOLON();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f36(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsesubsequent_declaration() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 264;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseIDENTIFIER();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsearray_specifiers();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = peg$currPos;
      s4 = peg$parseEQUAL();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseinitializer();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f37(s1, s2, s3);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinitial_declaration() {
    var s0, s1, s2, s3, s4, s5, s6, s7;
    var key = peg$currPos * 306 + 265;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsefully_specified_type();
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$parseIDENTIFIER();
      if (s3 !== peg$FAILED) {
        s4 = peg$parsearray_specifiers();
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        s5 = peg$currPos;
        s6 = peg$parseEQUAL();
        if (s6 !== peg$FAILED) {
          s7 = peg$parseinitializer();
          if (s7 !== peg$FAILED) {
            s6 = [s6, s7];
            s5 = s6;
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
        } else {
          peg$currPos = s5;
          s5 = peg$FAILED;
        }
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f38(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefully_specified_type() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 266;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsetype_qualifiers();
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    s2 = peg$parsetype_specifier();
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f39(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parselayout_qualifier() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;
    var key = peg$currPos * 306 + 267;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseLAYOUT();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseLEFT_PAREN();
      if (s2 !== peg$FAILED) {
        s3 = peg$currPos;
        s4 = peg$parselayout_qualifier_id();
        if (s4 !== peg$FAILED) {
          s5 = [];
          s6 = peg$currPos;
          s7 = peg$parseCOMMA();
          if (s7 !== peg$FAILED) {
            s8 = peg$parselayout_qualifier_id();
            if (s8 !== peg$FAILED) {
              s7 = [s7, s8];
              s6 = s7;
            } else {
              peg$currPos = s6;
              s6 = peg$FAILED;
            }
          } else {
            peg$currPos = s6;
            s6 = peg$FAILED;
          }
          while (s6 !== peg$FAILED) {
            s5.push(s6);
            s6 = peg$currPos;
            s7 = peg$parseCOMMA();
            if (s7 !== peg$FAILED) {
              s8 = peg$parselayout_qualifier_id();
              if (s8 !== peg$FAILED) {
                s7 = [s7, s8];
                s6 = s7;
              } else {
                peg$currPos = s6;
                s6 = peg$FAILED;
              }
            } else {
              peg$currPos = s6;
              s6 = peg$FAILED;
            }
          }
          peg$savedPos = s3;
          s3 = peg$f40(s1, s2, s4, s5);
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseRIGHT_PAREN();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f41(s1, s2, s3, s4);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parselayout_qualifier_id() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 268;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseIDENTIFIER();
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$parseEQUAL();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseternary_expression();
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f42(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseSHARED();
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsetype_qualifiers() {
    var s0, s1;
    var key = peg$currPos * 306 + 269;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = [];
    s1 = peg$parsesingle_type_qualifier();
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parsesingle_type_qualifier();
      }
    } else {
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsesingle_type_qualifier() {
    var s0, s1;
    var key = peg$currPos * 306 + 270;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parsestorage_qualifier();
    if (s0 === peg$FAILED) {
      s0 = peg$parselayout_qualifier();
      if (s0 === peg$FAILED) {
        s0 = peg$parseprecision_qualifier();
        if (s0 === peg$FAILED) {
          s0 = peg$parseinterpolation_qualifier();
          if (s0 === peg$FAILED) {
            s0 = peg$parseINVARIANT();
            if (s0 === peg$FAILED) {
              s0 = peg$parsePRECISE();
            }
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e236);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinterpolation_qualifier() {
    var s0, s1;
    var key = peg$currPos * 306 + 271;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parseSMOOTH();
    if (s0 === peg$FAILED) {
      s0 = peg$parseFLAT();
      if (s0 === peg$FAILED) {
        s0 = peg$parseNOPERSPECTIVE();
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e237);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsestorage_qualifier() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;
    var key = peg$currPos * 306 + 272;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parseCONST();
    if (s0 === peg$FAILED) {
      s0 = peg$parseINOUT();
      if (s0 === peg$FAILED) {
        s0 = peg$parseIN();
        if (s0 === peg$FAILED) {
          s0 = peg$parseOUT();
          if (s0 === peg$FAILED) {
            s0 = peg$parseCENTROID();
            if (s0 === peg$FAILED) {
              s0 = peg$parsePATCH();
              if (s0 === peg$FAILED) {
                s0 = peg$parseSAMPLE();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseUNIFORM();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseBUFFER();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseSHARED();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseCOHERENT();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseVOLATILE();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseRESTRICT();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseREADONLY();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parseWRITEONLY();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parseVARYING();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parseATTRIBUTE();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$currPos;
                                      s1 = peg$parseSUBROUTINE();
                                      if (s1 !== peg$FAILED) {
                                        s2 = peg$currPos;
                                        s3 = peg$parseLEFT_PAREN();
                                        if (s3 !== peg$FAILED) {
                                          s4 = peg$parseTYPE_NAME();
                                          if (s4 !== peg$FAILED) {
                                            s5 = [];
                                            s6 = peg$currPos;
                                            s7 = peg$parseCOMMA();
                                            if (s7 !== peg$FAILED) {
                                              s8 = peg$parseTYPE_NAME();
                                              if (s8 !== peg$FAILED) {
                                                s7 = [s7, s8];
                                                s6 = s7;
                                              } else {
                                                peg$currPos = s6;
                                                s6 = peg$FAILED;
                                              }
                                            } else {
                                              peg$currPos = s6;
                                              s6 = peg$FAILED;
                                            }
                                            while (s6 !== peg$FAILED) {
                                              s5.push(s6);
                                              s6 = peg$currPos;
                                              s7 = peg$parseCOMMA();
                                              if (s7 !== peg$FAILED) {
                                                s8 = peg$parseTYPE_NAME();
                                                if (s8 !== peg$FAILED) {
                                                  s7 = [s7, s8];
                                                  s6 = s7;
                                                } else {
                                                  peg$currPos = s6;
                                                  s6 = peg$FAILED;
                                                }
                                              } else {
                                                peg$currPos = s6;
                                                s6 = peg$FAILED;
                                              }
                                            }
                                            s6 = peg$parseRIGHT_PAREN();
                                            if (s6 !== peg$FAILED) {
                                              peg$savedPos = s2;
                                              s2 = peg$f43(s1, s3, s4, s5, s6);
                                            } else {
                                              peg$currPos = s2;
                                              s2 = peg$FAILED;
                                            }
                                          } else {
                                            peg$currPos = s2;
                                            s2 = peg$FAILED;
                                          }
                                        } else {
                                          peg$currPos = s2;
                                          s2 = peg$FAILED;
                                        }
                                        if (s2 === peg$FAILED) {
                                          s2 = null;
                                        }
                                        peg$savedPos = s0;
                                        s0 = peg$f44(s1, s2);
                                      } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e238);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsetype_specifier() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 273;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsetype_specifier_nonarray();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsearray_specifiers();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f45(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e239);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsetype_specifier_nonarray() {
    var s0, s1;
    var key = peg$currPos * 306 + 274;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parseVOID();
    if (s0 === peg$FAILED) {
      s0 = peg$parseFLOAT();
      if (s0 === peg$FAILED) {
        s0 = peg$parseDOUBLE();
        if (s0 === peg$FAILED) {
          s0 = peg$parseINT();
          if (s0 === peg$FAILED) {
            s0 = peg$parseUINT();
            if (s0 === peg$FAILED) {
              s0 = peg$parseBOOL();
              if (s0 === peg$FAILED) {
                s0 = peg$parseVEC2();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseVEC3();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseVEC4();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseDVEC2();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseDVEC3();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseDVEC4();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseBVEC2();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseBVEC3();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parseBVEC4();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parseIVEC2();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parseIVEC3();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parseIVEC4();
                                      if (s0 === peg$FAILED) {
                                        s0 = peg$parseUVEC2();
                                        if (s0 === peg$FAILED) {
                                          s0 = peg$parseUVEC3();
                                          if (s0 === peg$FAILED) {
                                            s0 = peg$parseUVEC4();
                                            if (s0 === peg$FAILED) {
                                              s0 = peg$parseMAT2();
                                              if (s0 === peg$FAILED) {
                                                s0 = peg$parseMAT3();
                                                if (s0 === peg$FAILED) {
                                                  s0 = peg$parseMAT4();
                                                  if (s0 === peg$FAILED) {
                                                    s0 = peg$parseMAT2X2();
                                                    if (s0 === peg$FAILED) {
                                                      s0 = peg$parseMAT2X3();
                                                      if (s0 === peg$FAILED) {
                                                        s0 = peg$parseMAT2X4();
                                                        if (s0 === peg$FAILED) {
                                                          s0 = peg$parseMAT3X2();
                                                          if (s0 === peg$FAILED) {
                                                            s0 = peg$parseMAT3X3();
                                                            if (s0 === peg$FAILED) {
                                                              s0 = peg$parseMAT3X4();
                                                              if (s0 === peg$FAILED) {
                                                                s0 = peg$parseMAT4X2();
                                                                if (s0 === peg$FAILED) {
                                                                  s0 = peg$parseMAT4X3();
                                                                  if (s0 === peg$FAILED) {
                                                                    s0 = peg$parseMAT4X4();
                                                                    if (s0 === peg$FAILED) {
                                                                      s0 = peg$parseDMAT2();
                                                                      if (s0 === peg$FAILED) {
                                                                        s0 = peg$parseDMAT3();
                                                                        if (s0 === peg$FAILED) {
                                                                          s0 = peg$parseDMAT4();
                                                                          if (s0 === peg$FAILED) {
                                                                            s0 = peg$parseDMAT2X2();
                                                                            if (s0 === peg$FAILED) {
                                                                              s0 = peg$parseDMAT2X3();
                                                                              if (s0 === peg$FAILED) {
                                                                                s0 = peg$parseDMAT2X4();
                                                                                if (s0 === peg$FAILED) {
                                                                                  s0 = peg$parseDMAT3X2();
                                                                                  if (s0 === peg$FAILED) {
                                                                                    s0 = peg$parseDMAT3X3();
                                                                                    if (s0 === peg$FAILED) {
                                                                                      s0 = peg$parseDMAT3X4();
                                                                                      if (s0 === peg$FAILED) {
                                                                                        s0 = peg$parseDMAT4X2();
                                                                                        if (s0 === peg$FAILED) {
                                                                                          s0 = peg$parseDMAT4X3();
                                                                                          if (s0 === peg$FAILED) {
                                                                                            s0 = peg$parseDMAT4X4();
                                                                                            if (s0 === peg$FAILED) {
                                                                                              s0 = peg$parseATOMIC_UINT();
                                                                                              if (s0 === peg$FAILED) {
                                                                                                s0 = peg$parseSAMPLER1D();
                                                                                                if (s0 === peg$FAILED) {
                                                                                                  s0 = peg$parseSAMPLER2D();
                                                                                                  if (s0 === peg$FAILED) {
                                                                                                    s0 = peg$parseSAMPLER3D();
                                                                                                    if (s0 === peg$FAILED) {
                                                                                                      s0 = peg$parseSAMPLERCUBE();
                                                                                                      if (s0 === peg$FAILED) {
                                                                                                        s0 = peg$parseSAMPLER1DSHADOW();
                                                                                                        if (s0 === peg$FAILED) {
                                                                                                          s0 = peg$parseSAMPLER2DSHADOW();
                                                                                                          if (s0 === peg$FAILED) {
                                                                                                            s0 = peg$parseSAMPLERCUBESHADOW();
                                                                                                            if (s0 === peg$FAILED) {
                                                                                                              s0 = peg$parseSAMPLER1DARRAY();
                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                s0 = peg$parseSAMPLER2DARRAY();
                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                  s0 = peg$parseSAMPLER1DARRAYSHADOW();
                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                    s0 = peg$parseSAMPLER2DARRAYSHADOW();
                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                      s0 = peg$parseSAMPLERCUBEARRAY();
                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                        s0 = peg$parseSAMPLERCUBEARRAYSHADOW();
                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                          s0 = peg$parseISAMPLER1D();
                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                            s0 = peg$parseISAMPLER2D();
                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                              s0 = peg$parseISAMPLER3D();
                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                s0 = peg$parseISAMPLERCUBE();
                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                  s0 = peg$parseISAMPLER1DARRAY();
                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                    s0 = peg$parseISAMPLER2DARRAY();
                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                      s0 = peg$parseISAMPLERCUBEARRAY();
                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                        s0 = peg$parseUSAMPLER1D();
                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                          s0 = peg$parseUSAMPLER2D();
                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                            s0 = peg$parseUSAMPLER3D();
                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                              s0 = peg$parseUSAMPLERCUBE();
                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                s0 = peg$parseUSAMPLER1DARRAY();
                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                  s0 = peg$parseUSAMPLER2DARRAY();
                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                    s0 = peg$parseUSAMPLERCUBEARRAY();
                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                      s0 = peg$parseSAMPLER2DRECT();
                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                        s0 = peg$parseSAMPLER2DRECTSHADOW();
                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                          s0 = peg$parseISAMPLER2DRECT();
                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                            s0 = peg$parseUSAMPLER2DRECT();
                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                              s0 = peg$parseSAMPLERBUFFER();
                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                s0 = peg$parseISAMPLERBUFFER();
                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                  s0 = peg$parseUSAMPLERBUFFER();
                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                    s0 = peg$parseSAMPLER2DMS();
                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                      s0 = peg$parseISAMPLER2DMS();
                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                        s0 = peg$parseUSAMPLER2DMS();
                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                          s0 = peg$parseSAMPLER2DMSARRAY();
                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                            s0 = peg$parseISAMPLER2DMSARRAY();
                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                              s0 = peg$parseUSAMPLER2DMSARRAY();
                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                s0 = peg$parseIMAGE1D();
                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                  s0 = peg$parseIIMAGE1D();
                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                    s0 = peg$parseUIMAGE1D();
                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                      s0 = peg$parseIMAGE2D();
                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                        s0 = peg$parseIIMAGE2D();
                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                          s0 = peg$parseUIMAGE2D();
                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                            s0 = peg$parseIMAGE3D();
                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                              s0 = peg$parseIIMAGE3D();
                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                s0 = peg$parseUIMAGE3D();
                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                  s0 = peg$parseIMAGE2DRECT();
                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                    s0 = peg$parseIIMAGE2DRECT();
                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                      s0 = peg$parseUIMAGE2DRECT();
                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                        s0 = peg$parseIMAGECUBE();
                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                          s0 = peg$parseIIMAGECUBE();
                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                            s0 = peg$parseUIMAGECUBE();
                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                              s0 = peg$parseIMAGEBUFFER();
                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                s0 = peg$parseIIMAGEBUFFER();
                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                  s0 = peg$parseUIMAGEBUFFER();
                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                    s0 = peg$parseIMAGE1DARRAY();
                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                      s0 = peg$parseIIMAGE1DARRAY();
                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                        s0 = peg$parseUIMAGE1DARRAY();
                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                          s0 = peg$parseIMAGE2DARRAY();
                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                            s0 = peg$parseIIMAGE2DARRAY();
                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                              s0 = peg$parseUIMAGE2DARRAY();
                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                s0 = peg$parseIMAGECUBEARRAY();
                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                  s0 = peg$parseIIMAGECUBEARRAY();
                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                    s0 = peg$parseUIMAGECUBEARRAY();
                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                      s0 = peg$parseIMAGE2DMS();
                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                        s0 = peg$parseIIMAGE2DMS();
                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                          s0 = peg$parseUIMAGE2DMS();
                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                            s0 = peg$parseIMAGE2DMSARRAY();
                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                              s0 = peg$parseIIMAGE2DMSARRAY();
                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                s0 = peg$parseUIMAGE2DMSARRAY();
                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                  s0 = peg$parsestruct_specifier();
                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                    s0 = peg$parseTYPE_NAME();
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                  }
                                                                                                                                                                                                                }
                                                                                                                                                                                                              }
                                                                                                                                                                                                            }
                                                                                                                                                                                                          }
                                                                                                                                                                                                        }
                                                                                                                                                                                                      }
                                                                                                                                                                                                    }
                                                                                                                                                                                                  }
                                                                                                                                                                                                }
                                                                                                                                                                                              }
                                                                                                                                                                                            }
                                                                                                                                                                                          }
                                                                                                                                                                                        }
                                                                                                                                                                                      }
                                                                                                                                                                                    }
                                                                                                                                                                                  }
                                                                                                                                                                                }
                                                                                                                                                                              }
                                                                                                                                                                            }
                                                                                                                                                                          }
                                                                                                                                                                        }
                                                                                                                                                                      }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e239);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsearray_specifiers() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 275;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$currPos;
    s3 = peg$parseLEFT_BRACKET();
    if (s3 !== peg$FAILED) {
      s4 = peg$parseternary_expression();
      if (s4 === peg$FAILED) {
        s4 = null;
      }
      s5 = peg$parseRIGHT_BRACKET();
      if (s5 !== peg$FAILED) {
        peg$savedPos = s2;
        s2 = peg$f46(s3, s4, s5);
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = peg$parseLEFT_BRACKET();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseternary_expression();
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          s5 = peg$parseRIGHT_BRACKET();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s2;
            s2 = peg$f46(s3, s4, s5);
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f47(s1);
    }
    s0 = s1;
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e240);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseprecision_qualifier() {
    var s0, s1;
    var key = peg$currPos * 306 + 276;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parseHIGH_PRECISION();
    if (s0 === peg$FAILED) {
      s0 = peg$parseMEDIUM_PRECISION();
      if (s0 === peg$FAILED) {
        s0 = peg$parseLOW_PRECISION();
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e241);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsestruct_specifier() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 277;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseSTRUCT();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseTYPE_NAME();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = peg$parseLEFT_BRACE();
      if (s3 !== peg$FAILED) {
        s4 = peg$parsestruct_declaration_list();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseRIGHT_BRACE();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f48(s1, s2, s3, s4, s5);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e242);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsestruct_declaration_list() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 278;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = [];
    s1 = peg$currPos;
    s2 = peg$parsestruct_declaration();
    if (s2 !== peg$FAILED) {
      s3 = peg$parseSEMICOLON();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s1;
        s1 = peg$f49(s2, s3);
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$currPos;
        s2 = peg$parsestruct_declaration();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseSEMICOLON();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s1;
            s1 = peg$f49(s2, s3);
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      }
    } else {
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsestruct_declaration() {
    var s0, s1, s2, s3, s4, s5, s6;
    var key = peg$currPos * 306 + 279;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsefully_specified_type();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsequantified_identifier();
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$currPos;
        s5 = peg$parseCOMMA();
        if (s5 !== peg$FAILED) {
          s6 = peg$parsequantified_identifier();
          if (s6 !== peg$FAILED) {
            s5 = [s5, s6];
            s4 = s5;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$currPos;
          s5 = peg$parseCOMMA();
          if (s5 !== peg$FAILED) {
            s6 = peg$parsequantified_identifier();
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        }
        peg$savedPos = s0;
        s0 = peg$f50(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsequantified_identifier() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 280;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseIDENTIFIER();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsearray_specifiers();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f51(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinitializer() {
    var s0, s1, s2, s3, s4, s5, s6;
    var key = peg$currPos * 306 + 281;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parseassignment_expression();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseLEFT_BRACE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinitializer();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          s5 = peg$parseCOMMA();
          if (s5 !== peg$FAILED) {
            s6 = peg$parseinitializer();
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            s5 = peg$parseCOMMA();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseinitializer();
              if (s6 !== peg$FAILED) {
                s5 = [s5, s6];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          }
          s4 = peg$parseCOMMA();
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          s5 = peg$parseRIGHT_BRACE();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f52(s1, s2, s3, s4, s5);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsestatement() {
    var s0;
    var key = peg$currPos * 306 + 282;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parsecompound_statement();
    if (s0 === peg$FAILED) {
      s0 = peg$parsesimple_statement();
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsesimple_statement() {
    var s0;
    var key = peg$currPos * 306 + 283;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parsejump_statement();
    if (s0 === peg$FAILED) {
      s0 = peg$parsedeclaration_statement();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_statement();
        if (s0 === peg$FAILED) {
          s0 = peg$parseif_statement();
          if (s0 === peg$FAILED) {
            s0 = peg$parseswitch_statement();
            if (s0 === peg$FAILED) {
              s0 = peg$parsecase_label();
              if (s0 === peg$FAILED) {
                s0 = peg$parseiteration_statement();
              }
            }
          }
        }
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsecompound_statement() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 284;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parseLEFT_BRACE();
    if (s2 !== peg$FAILED) {
      peg$savedPos = s1;
      s2 = peg$f53(s2);
    }
    s1 = s2;
    if (s1 !== peg$FAILED) {
      s2 = peg$parsestatement_list();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = peg$parseRIGHT_BRACE();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f54(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsecompound_statement_no_new_scope() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 285;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseLEFT_BRACE();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsestatement_list();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = peg$parseRIGHT_BRACE();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f55(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsestatement_no_new_scope() {
    var s0;
    var key = peg$currPos * 306 + 286;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parsecompound_statement_no_new_scope();
    if (s0 === peg$FAILED) {
      s0 = peg$parsesimple_statement();
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsestatement_list() {
    var s0, s1;
    var key = peg$currPos * 306 + 287;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = [];
    s1 = peg$parsestatement();
    if (s1 === peg$FAILED) {
      s1 = peg$parsepreprocessor();
    }
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parsestatement();
        if (s1 === peg$FAILED) {
          s1 = peg$parsepreprocessor();
        }
      }
    } else {
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseexpression_statement() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 288;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseexpression();
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    s2 = peg$parseSEMICOLON();
    if (s2 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f56(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseif_statement() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
    var key = peg$currPos * 306 + 289;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseIF();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseLEFT_PAREN();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseexpression();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseRIGHT_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = peg$currPos;
            s6 = peg$parsestatement();
            if (s6 !== peg$FAILED) {
              s7 = peg$currPos;
              s8 = peg$parseELSE();
              if (s8 !== peg$FAILED) {
                s9 = peg$parsestatement();
                if (s9 !== peg$FAILED) {
                  s8 = [s8, s9];
                  s7 = s8;
                } else {
                  peg$currPos = s7;
                  s7 = peg$FAILED;
                }
              } else {
                peg$currPos = s7;
                s7 = peg$FAILED;
              }
              if (s7 === peg$FAILED) {
                s7 = null;
              }
              s6 = [s6, s7];
              s5 = s6;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f57(s1, s2, s3, s4, s5);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseswitch_statement() {
    var s0, s1, s2, s3, s4, s5, s6, s7;
    var key = peg$currPos * 306 + 290;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseSWITCH();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseLEFT_PAREN();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseexpression();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseRIGHT_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseLEFT_BRACE();
            if (s5 !== peg$FAILED) {
              s6 = peg$parsestatement_list();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseRIGHT_BRACE();
                if (s7 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s0 = peg$f58(s1, s2, s3, s4, s5, s6, s7);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsecase_label() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 291;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseCASE();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseexpression();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseCOLON();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f59(s1, s2, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseDEFAULT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseCOLON();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f60(s1, s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseiteration_statement() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;
    var key = peg$currPos * 306 + 292;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parseWHILE();
    if (s2 !== peg$FAILED) {
      peg$savedPos = s1;
      s2 = peg$f61(s2);
    }
    s1 = s2;
    if (s1 !== peg$FAILED) {
      s2 = peg$parseLEFT_PAREN();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsecondition();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseRIGHT_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsestatement_no_new_scope();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f62(s1, s2, s3, s4, s5);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseDO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestatement();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseWHILE();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseLEFT_PAREN();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseRIGHT_PAREN();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseSEMICOLON();
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f63(s1, s2, s3, s4, s5, s6, s7);
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$parseFOR();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s1;
          s2 = peg$f64(s2);
        }
        s1 = s2;
        if (s1 !== peg$FAILED) {
          s2 = peg$parseLEFT_PAREN();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseexpression_statement();
            if (s3 === peg$FAILED) {
              s3 = peg$parsedeclaration_statement();
            }
            if (s3 === peg$FAILED) {
              s3 = null;
            }
            s4 = peg$parsecondition();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            s5 = peg$parseSEMICOLON();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseexpression();
              if (s6 === peg$FAILED) {
                s6 = null;
              }
              s7 = peg$parseRIGHT_PAREN();
              if (s7 !== peg$FAILED) {
                s8 = peg$parsestatement_no_new_scope();
                if (s8 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s0 = peg$f65(s1, s2, s3, s4, s5, s6, s7, s8);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e243);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsecondition() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 293;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsefully_specified_type();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseIDENTIFIER();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseEQUAL();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseinitializer();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f66(s1, s2, s3, s4);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseexpression();
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsejump_statement() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 306 + 294;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseCONTINUE();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseSEMICOLON();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f67(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseBREAK();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseSEMICOLON();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f68(s1, s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseRETURN();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseexpression();
          if (s2 === peg$FAILED) {
            s2 = null;
          }
          s3 = peg$parseSEMICOLON();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f69(s1, s2, s3);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseDISCARD();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseSEMICOLON();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f70(s1, s2);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e244);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsepreprocessor() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 295;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 35) {
      s3 = peg$c210;
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e246);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = [];
      if (peg$r11.test(input.charAt(peg$currPos))) {
        s5 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e247);
        }
      }
      while (s5 !== peg$FAILED) {
        s4.push(s5);
        if (peg$r11.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e247);
          }
        }
      }
      s3 = [s3, s4];
      s2 = s3;
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f71(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e245);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsetranslation_unit() {
    var s0, s1;
    var key = peg$currPos * 306 + 296;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = [];
    s1 = peg$parseexternal_declaration();
    if (s1 === peg$FAILED) {
      s1 = peg$parsepreprocessor();
    }
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseexternal_declaration();
        if (s1 === peg$FAILED) {
          s1 = peg$parsepreprocessor();
        }
      }
    } else {
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_prototype_statement() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 297;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsefunction_prototype_no_new_scope();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseSEMICOLON();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f72(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseexternal_declaration() {
    var s0;
    var key = peg$currPos * 306 + 298;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parsefunction_prototype_statement();
    if (s0 === peg$FAILED) {
      s0 = peg$parsefunction_definition();
      if (s0 === peg$FAILED) {
        s0 = peg$parsedeclaration_statement();
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsefunction_definition() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 299;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsefunction_prototype_new_scope();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsecompound_statement_no_new_scope();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f73(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parse_() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 300;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsewhitespace();
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    s2 = [];
    s3 = peg$currPos;
    s4 = peg$parsecomment();
    if (s4 !== peg$FAILED) {
      s5 = peg$parsewhitespace();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s4 = [s4, s5];
      s3 = s4;
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    while (s3 !== peg$FAILED) {
      s2.push(s3);
      s3 = peg$currPos;
      s4 = peg$parsecomment();
      if (s4 !== peg$FAILED) {
        s5 = peg$parsewhitespace();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    }
    peg$savedPos = s0;
    s0 = peg$f74(s1, s2);
    peg$silentFails--;
    s1 = peg$FAILED;
    if (peg$silentFails === 0) {
      peg$fail(peg$e248);
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsecomment() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 306 + 301;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parsesingle_comment();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parsemultiline_comment();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsewhitespace();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsecomment();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s3;
            s3 = peg$f75(s1, s4, s5);
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsewhitespace();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsecomment();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s3;
              s3 = peg$f75(s1, s4, s5);
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        peg$savedPos = s0;
        s0 = peg$f76(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsesingle_comment() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 306 + 302;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c211) {
      s2 = peg$c211;
      peg$currPos += 2;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e249);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      if (peg$r11.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e247);
        }
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        if (peg$r11.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e247);
          }
        }
      }
      s2 = [s2, s3];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsemultiline_comment() {
    var s0, s1, s2, s3, s4, s5, s6;
    var key = peg$currPos * 306 + 303;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c212) {
      s2 = peg$c212;
      peg$currPos += 2;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e250);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      s4 = peg$currPos;
      s5 = peg$currPos;
      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c213) {
        s6 = peg$c213;
        peg$currPos += 2;
      } else {
        s6 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e251);
        }
      }
      peg$silentFails--;
      if (s6 === peg$FAILED) {
        s5 = void 0;
      } else {
        peg$currPos = s5;
        s5 = peg$FAILED;
      }
      if (s5 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s6 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e252);
          }
        }
        if (s6 !== peg$FAILED) {
          peg$savedPos = s4;
          s4 = peg$f77(s6);
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$currPos;
        s5 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c213) {
          s6 = peg$c213;
          peg$currPos += 2;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e251);
          }
        }
        peg$silentFails--;
        if (s6 === peg$FAILED) {
          s5 = void 0;
        } else {
          peg$currPos = s5;
          s5 = peg$FAILED;
        }
        if (s5 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s6 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e252);
            }
          }
          if (s6 !== peg$FAILED) {
            peg$savedPos = s4;
            s4 = peg$f77(s6);
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      }
      if (input.substr(peg$currPos, 2) === peg$c213) {
        s4 = peg$c213;
        peg$currPos += 2;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e251);
        }
      }
      if (s4 !== peg$FAILED) {
        s2 = [s2, s3, s4];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsewhitespace() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 304;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = [];
    if (peg$r12.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e253);
      }
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$r12.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e253);
          }
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseterminal() {
    var s0, s1, s2;
    var key = peg$currPos * 306 + 305;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    if (peg$r1.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e209);
      }
    }
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f78(s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  const context = {
    options,
    location,
    text
  };
  const {
    getLocation,
    node,
    makeScope,
    warn,
    pushScope,
    popScope,
    setScopeEnd,
    createFunctionPrototype,
    addFunctionCallReference,
    createFunctionDefinition,
    addTypeReference,
    addTypeIfFound,
    createType,
    addOrCreateBindingReference,
    createBindings,
    groupCases
  } = makeLocals(context);
  peg$result = peg$startRuleFunction();
  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }
    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

// dist/error.js
var __extends = /* @__PURE__ */ function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __assign2 = function() {
  __assign2 = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign2.apply(this, arguments);
};
var GlslSyntaxError = (
  /** @class */
  function(_super) {
    __extends(GlslSyntaxError2, _super);
    function GlslSyntaxError2(source, grammarSource, error) {
      var _this = _super.call(this, error.format([{ source: grammarSource, text: source }])) || this;
      _this.location = error.location;
      _this.expected = error.expected;
      _this.found = error.found;
      return _this;
    }
    return GlslSyntaxError2;
  }(Error)
);
var DEFAULT_GRAMMAR_SOURCE = "location";
var formatError = function(parser, grammarSource) {
  if (grammarSource === void 0) {
    grammarSource = DEFAULT_GRAMMAR_SOURCE;
  }
  return function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var src = args[0], options = args[1];
    try {
      return parser.parse(src, __assign2({ grammarSource }, options));
    } catch (e) {
      if (e instanceof parser.SyntaxError) {
        throw new GlslSyntaxError(src, grammarSource, e);
      }
      throw e;
    }
  };
};

// dist/parser/index.js
var parse = formatError(parser_exports);
var parser_default = parse;

// dist/preprocessor/generator.js
var makeGeneratorPreprocessor = makeGenerator;
var generators2 = {
  program: function(node) {
    return generate2(node.program) + generate2(node.wsEnd);
  },
  segment: function(node) {
    return generate2(node.blocks);
  },
  text: function(node) {
    return generate2(node.text);
  },
  literal: function(node) {
    return generate2(node.wsStart) + generate2(node.literal) + generate2(node.wsEnd);
  },
  identifier: function(node) {
    return generate2(node.identifier) + generate2(node.wsEnd);
  },
  binary: function(node) {
    return generate2(node.left) + generate2(node.operator) + generate2(node.right);
  },
  group: function(node) {
    return generate2(node.lp) + generate2(node.expression) + generate2(node.rp);
  },
  unary: function(node) {
    return generate2(node.operator) + generate2(node.expression);
  },
  unary_defined: function(node) {
    return generate2(node.operator) + generate2(node.lp) + generate2(node.identifier) + generate2(node.rp);
  },
  int_constant: function(node) {
    return generate2(node.token) + generate2(node.wsEnd);
  },
  elseif: function(node) {
    return generate2(node.token) + generate2(node.expression) + generate2(node.wsEnd) + generate2(node.body);
  },
  if: function(node) {
    return generate2(node.token) + generate2(node.expression) + generate2(node.wsEnd) + generate2(node.body);
  },
  ifdef: function(node) {
    return generate2(node.token) + generate2(node.identifier) + generate2(node.wsEnd) + generate2(node.body);
  },
  ifndef: function(node) {
    return generate2(node.token) + generate2(node.identifier) + generate2(node.wsEnd) + generate2(node.body);
  },
  else: function(node) {
    return generate2(node.token) + generate2(node.wsEnd) + generate2(node.body);
  },
  error: function(node) {
    return generate2(node.error) + generate2(node.message) + generate2(node.wsEnd);
  },
  undef: function(node) {
    return generate2(node.undef) + generate2(node.identifier) + generate2(node.wsEnd);
  },
  define: function(node) {
    return generate2(node.wsStart) + generate2(node.define) + generate2(node.identifier) + generate2(node.body) + generate2(node.wsEnd);
  },
  define_arguments: function(node) {
    return generate2(node.wsStart) + generate2(node.define) + generate2(node.identifier) + generate2(node.lp) + generate2(node.args) + generate2(node.rp) + generate2(node.body) + generate2(node.wsEnd);
  },
  conditional: function(node) {
    return generate2(node.wsStart) + generate2(node.ifPart) + // generate(node.body) +
    generate2(node.elseIfParts) + generate2(node.elsePart) + generate2(node.endif) + generate2(node.wsEnd);
  },
  version: function(node) {
    return generate2(node.version) + generate2(node.value) + generate2(node.profile) + generate2(node.wsEnd);
  },
  pragma: function(node) {
    return generate2(node.pragma) + generate2(node.body) + generate2(node.wsEnd);
  },
  line: function(node) {
    return generate2(node.line) + generate2(node.value) + generate2(node.wsEnd);
  },
  extension: function(node) {
    return generate2(node.extension) + generate2(node.name) + generate2(node.colon) + generate2(node.behavior) + generate2(node.wsEnd);
  }
};
var generate2 = makeGeneratorPreprocessor(generators2);
var generator_default2 = generate2;

// dist/preprocessor/preprocessor.js
var __assign3 = function() {
  __assign3 = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign3.apply(this, arguments);
};
var __spreadArray3 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var without = function(obj) {
  var keys = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    keys[_i - 1] = arguments[_i];
  }
  return Object.entries(obj).reduce(function(acc, _a) {
    var _b;
    var key = _a[0], value = _a[1];
    return __assign3(__assign3({}, acc), !keys.includes(key) && (_b = {}, _b[key] = value, _b));
  }, {});
};
var scanFunctionArgs = function(src) {
  var char;
  var parens = 0;
  var args = [];
  var arg = "";
  for (var i = 0; i < src.length; i++) {
    char = src.charAt(i);
    if (char === "(") {
      parens++;
    }
    if (char === ")") {
      parens--;
    }
    if (parens === -1) {
      if (arg !== "" || args.length) {
        args.push(arg);
      }
      return { args, length: i };
    }
    if (char === "," && parens === 0) {
      args.push(arg);
      arg = "";
    } else {
      arg += char;
    }
  }
  return null;
};
var preprocessComments = function(src) {
  var i;
  var chr;
  var la;
  var out = "";
  var line = 1;
  var in_single = 0;
  var in_multi = 0;
  for (i = 0; i < src.length; i++) {
    chr = src.substring(i, i + 1);
    la = src.substring(i + 1, i + 2);
    if (chr == "/" && la == "/" && !in_single && !in_multi) {
      in_single = line;
      i++;
      continue;
    }
    if (chr == "\n" && in_single) {
      in_single = 0;
    }
    if (chr == "/" && la == "*" && !in_multi && !in_single) {
      in_multi = line;
      i++;
      continue;
    }
    if (chr == "*" && la == "/" && in_multi) {
      if (in_multi == line) {
        out += " ";
      }
      in_multi = 0;
      i++;
      continue;
    }
    if (!in_multi && !in_single || chr == "\n") {
      out += chr;
      line++;
    }
  }
  return out;
};
var tokenPaste = function(str) {
  return str.replace(/\s+##\s+/g, "");
};
var evaluate = function(ast, evaluators) {
  var visit2 = function(node) {
    var evaluator = evaluators[node.type];
    if (!evaluator) {
      throw new Error("No evaluate() evaluator for ".concat(node.type));
    }
    return evaluator(node, visit2);
  };
  return visit2(ast);
};
var expandFunctionMacro = function(macros, macroName, macro, text) {
  var pattern = "\\b".concat(macroName, "\\s*\\(");
  var startRegex = new RegExp(pattern, "m");
  var expanded = "";
  var current = text;
  var startMatch;
  var _loop_1 = function() {
    var result = scanFunctionArgs(current.substring(startMatch.index + startMatch[0].length));
    if (result === null) {
      throw new Error("".concat(current.match(startRegex), " unterminated macro invocation"));
    }
    var macroArgs = (macro.args || []).filter(function(arg) {
      return arg.literal !== ",";
    });
    var args = result.args, argLength = result.length;
    var matchLength = startMatch[0].length + argLength + 1;
    if (args.length > macroArgs.length) {
      throw new Error("'".concat(macroName, "': Too many arguments for macro"));
    }
    if (args.length < macroArgs.length) {
      throw new Error("'".concat(macroName, "': Not enough arguments for macro"));
    }
    var argIdentifiers = macroArgs.map(function(a) {
      return a.identifier;
    });
    var argKeys = argIdentifiers.reduce(function(acc, identifier, index) {
      var _a;
      return __assign3(__assign3({}, acc), (_a = {}, _a[identifier] = expandMacros(args[index].trim(), macros), _a));
    }, {});
    var replacedBody = tokenPaste(macro.body.replace(
      // Replace all instances of macro arguments in the macro definition
      // (the arg separated by word boundaries) with its user defined
      // replacement. This one-pass strategy ensures that we won't clobber
      // previous replacements when the user supplied args have the same names
      // as the macro arguments
      new RegExp("(" + argIdentifiers.map(function(a) {
        return "\\b".concat(a, "\\b");
      }).join("|") + ")", "g"),
      function(match) {
        return match in argKeys ? argKeys[match] : match;
      }
    ));
    var expandedReplace = expandMacros(replacedBody, without(macros, macroName));
    var endOfReplace = startMatch.index + expandedReplace.length;
    var processed = current.replace(current.substring(startMatch.index, startMatch.index + matchLength), expandedReplace);
    expanded += processed.substring(0, endOfReplace);
    current = processed.substring(endOfReplace);
  };
  while (startMatch = startRegex.exec(current)) {
    _loop_1();
  }
  return expanded + current;
};
var expandObjectMacro = function(macros, macroName, macro, text) {
  var regex = new RegExp("\\b".concat(macroName, "\\b"), "g");
  var expanded = text;
  if (regex.test(text)) {
    var replacement = macro.body || "";
    var scanned = expandMacros(replacement, without(macros, macroName));
    expanded = tokenPaste(text.replace(new RegExp("\\b".concat(macroName, "\\b"), "g"), scanned));
  }
  return expanded;
};
var expandMacros = function(text, macros) {
  return Object.entries(macros).reduce(function(result, _a) {
    var macroName = _a[0], macro = _a[1];
    return macro.args ? expandFunctionMacro(macros, macroName, macro, result) : expandObjectMacro(macros, macroName, macro, result);
  }, text);
};
var isTruthy = function(x) {
  return !!x;
};
var expandInExpressions = function(macros) {
  var expressions = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    expressions[_i - 1] = arguments[_i];
  }
  expressions.forEach(function(expression) {
    visitPreprocessedAst(expression, {
      unary_defined: {
        enter: function(path) {
          path.skip();
        }
      },
      identifier: {
        enter: function(path) {
          path.node.identifier = expandMacros(path.node.identifier, macros);
        }
      }
    });
  });
};
var evaluateIfPart = function(macros, ifPart) {
  if (ifPart.type === "if") {
    return evaluteExpression(ifPart.expression, macros);
  } else if (ifPart.type === "ifdef") {
    return ifPart.identifier.identifier in macros;
  } else if (ifPart.type === "ifndef") {
    return !(ifPart.identifier.identifier in macros);
  }
};
var evaluteExpression = function(node, macros) {
  return evaluate(node, {
    // TODO: Handle non-base-10 numbers. Should these be parsed in the peg grammar?
    int_constant: function(node2) {
      return parseInt(node2.token, 10);
    },
    unary_defined: function(node2) {
      return node2.identifier.identifier in macros;
    },
    identifier: function(node2) {
      return node2.identifier;
    },
    group: function(node2, visit2) {
      return visit2(node2.expression);
    },
    binary: function(_a, visit2) {
      var left = _a.left, right = _a.right, literal = _a.operator.literal;
      switch (literal) {
        // multiplicative
        case "*": {
          return visit2(left) * visit2(right);
        }
        // division
        case "/": {
          return visit2(left) / visit2(right);
        }
        // modulo
        case "%": {
          return visit2(left) % visit2(right);
        }
        // addition
        case "+": {
          return visit2(left) + visit2(right);
        }
        // subtraction
        case "-": {
          return visit2(left) - visit2(right);
        }
        // bit-wise shift
        case "<<": {
          return visit2(left) << visit2(right);
        }
        // bit-wise shift
        case ">>": {
          return visit2(left) >> visit2(right);
        }
        case "<": {
          return visit2(left) < visit2(right);
        }
        case ">": {
          return visit2(left) > visit2(right);
        }
        case "<=": {
          return visit2(left) <= visit2(right);
        }
        case ">=": {
          return visit2(left) >= visit2(right);
        }
        case "==": {
          return visit2(left) == visit2(right);
        }
        case "!=": {
          return visit2(left) != visit2(right);
        }
        // bit-wise and
        case "&": {
          return visit2(left) & visit2(right);
        }
        // bit-wise exclusive or
        case "^": {
          return visit2(left) ^ visit2(right);
        }
        // bit-wise inclusive or
        case "|": {
          return visit2(left) | visit2(right);
        }
        case "&&": {
          return visit2(left) && visit2(right);
        }
        case "||": {
          return visit2(left) || visit2(right);
        }
        default: {
          throw new Error("Preprocessing error: Unknown binary operator ".concat(literal));
        }
      }
    },
    unary: function(node2, visit2) {
      switch (node2.operator.literal) {
        case "+": {
          return visit2(node2.expression);
        }
        case "-": {
          return -1 * visit2(node2.expression);
        }
        case "!": {
          return !visit2(node2.expression);
        }
        case "~": {
          return ~visit2(node2.expression);
        }
        default: {
          throw new Error("Preprocessing error: Unknown unary operator ".concat(node2.operator.literal));
        }
      }
    }
  });
};
var shouldPreserve = function(preserve) {
  if (preserve === void 0) {
    preserve = {};
  }
  return function(path) {
    var test = preserve === null || preserve === void 0 ? void 0 : preserve[path.node.type];
    return typeof test === "function" ? test(path) : test;
  };
};
var visitPreprocessedAst = visit;
var convertPath = function(p) {
  return p;
};
var unescapeSrc = function(src, options) {
  if (options === void 0) {
    options = {};
  }
  return src.replace(/\\[\n\r]/g, "");
};
var preprocessAst = function(program, options) {
  if (options === void 0) {
    options = {};
  }
  var macros = Object.entries(options.defines || {}).reduce(function(defines, _a) {
    var _b;
    var name = _a[0], body = _a[1];
    return __assign3(__assign3({}, defines), (_b = {}, _b[name] = { body }, _b));
  }, {});
  var preserve = options.preserve;
  var preserveNode = shouldPreserve(preserve);
  visitPreprocessedAst(program, {
    conditional: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        var node = path.node;
        if (preserveNode(path)) {
          return;
        }
        expandInExpressions.apply(void 0, __spreadArray3([macros], __spreadArray3([
          node.ifPart.expression
        ], node.elseIfParts.map(function(elif) {
          return elif.expression;
        }), true).filter(isTruthy), false));
        if (evaluateIfPart(macros, node.ifPart)) {
          path.replaceWith(node.ifPart.body);
        } else {
          var elseBranchHit = node.elseIfParts.reduce(function(res, elif) {
            return res || evaluteExpression(elif.expression, macros) && // path/visit hack to remove type error
            (path.replaceWith(elif.body), true);
          }, false);
          if (!elseBranchHit) {
            if (node.elsePart) {
              path.replaceWith(node.elsePart.body);
            } else {
              path.remove();
            }
          }
        }
      }
    },
    text: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        path.node.text = expandMacros(path.node.text, macros);
      }
    },
    define_arguments: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        var _a = path.node, identifier = _a.identifier.identifier, body = _a.body, args = _a.args;
        macros[identifier] = { args, body };
        !preserveNode(path) && path.remove();
      }
    },
    define: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        var _a = path.node, identifier = _a.identifier.identifier, body = _a.body;
        macros[identifier] = { body };
        !preserveNode(path) && path.remove();
      }
    },
    undef: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        delete macros[path.node.identifier.identifier];
        !preserveNode(path) && path.remove();
      }
    },
    error: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        if (options.stopOnError) {
          throw new Error(path.node.message);
        }
        !preserveNode(path) && path.remove();
      }
    },
    pragma: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        !preserveNode(path) && path.remove();
      }
    },
    version: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        !preserveNode(path) && path.remove();
      }
    },
    extension: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        !preserveNode(path) && path.remove();
      }
    },
    // TODO: Causes a failure
    line: {
      enter: function(initialPath) {
        var path = convertPath(initialPath);
        !preserveNode(path) && path.remove();
      }
    }
  });
  return program;
};

// dist/preprocessor/preprocessor-parser.js
var preprocessor_parser_exports = {};
__export(preprocessor_parser_exports, {
  SyntaxError: () => peg$SyntaxError2,
  parse: () => peg$parse2
});
function peg$subclass2(child, parent) {
  function C() {
    this.constructor = child;
  }
  C.prototype = parent.prototype;
  child.prototype = new C();
}
function peg$SyntaxError2(message, expected, found, location) {
  var self = Error.call(this, message);
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(self, peg$SyntaxError2.prototype);
  }
  self.expected = expected;
  self.found = found;
  self.location = location;
  self.name = "SyntaxError";
  return self;
}
peg$subclass2(peg$SyntaxError2, Error);
function peg$padEnd2(str, targetLength, padString) {
  padString = padString || " ";
  if (str.length > targetLength) {
    return str;
  }
  targetLength -= str.length;
  padString += padString.repeat(targetLength);
  return str + padString.slice(0, targetLength);
}
peg$SyntaxError2.prototype.format = function(sources) {
  var str = "Error: " + this.message;
  if (this.location) {
    var src = null;
    var k;
    for (k = 0; k < sources.length; k++) {
      if (sources[k].source === this.location.source) {
        src = sources[k].text.split(/\r\n|\n|\r/g);
        break;
      }
    }
    var s = this.location.start;
    var loc = this.location.source + ":" + s.line + ":" + s.column;
    if (src) {
      var e = this.location.end;
      var filler = peg$padEnd2("", s.line.toString().length);
      var line = src[s.line - 1];
      var last = s.line === e.line ? e.column : line.length + 1;
      str += "\n --> " + loc + "\n" + filler + " |\n" + s.line + " | " + line + "\n" + filler + " | " + peg$padEnd2("", s.column - 1) + peg$padEnd2("", last - s.column, "^");
    } else {
      str += "\n at " + loc;
    }
  }
  return str;
};
peg$SyntaxError2.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
    literal: function(expectation) {
      return '"' + literalEscape(expectation.text) + '"';
    },
    class: function(expectation) {
      var escapedParts = expectation.parts.map(function(part) {
        return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
      });
      return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
    },
    any: function() {
      return "any character";
    },
    end: function() {
      return "end of input";
    },
    other: function(expectation) {
      return expectation.description;
    }
  };
  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }
  function literalEscape(s) {
    return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
      return "\\x0" + hex(ch);
    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
      return "\\x" + hex(ch);
    });
  }
  function classEscape(s) {
    return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
      return "\\x0" + hex(ch);
    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
      return "\\x" + hex(ch);
    });
  }
  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }
  function describeExpected(expected2) {
    var descriptions = expected2.map(describeExpectation);
    var i, j;
    descriptions.sort();
    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }
    switch (descriptions.length) {
      case 1:
        return descriptions[0];
      case 2:
        return descriptions[0] + " or " + descriptions[1];
      default:
        return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
    }
  }
  function describeFound(found2) {
    return found2 ? '"' + literalEscape(found2) + '"' : "end of input";
  }
  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};
function peg$parse2(input, options) {
  options = options !== void 0 ? options : {};
  var peg$FAILED = {};
  var peg$source = options.grammarSource;
  var peg$startRuleFunctions = { start: peg$parsestart };
  var peg$startRuleFunction = peg$parsestart;
  var peg$c0 = "<<";
  var peg$c1 = ">>";
  var peg$c2 = "<=";
  var peg$c3 = ">=";
  var peg$c4 = "==";
  var peg$c5 = "!=";
  var peg$c6 = "&&";
  var peg$c7 = "||";
  var peg$c8 = "(";
  var peg$c9 = ")";
  var peg$c10 = ",";
  var peg$c11 = "!";
  var peg$c12 = "-";
  var peg$c13 = "~";
  var peg$c14 = "+";
  var peg$c15 = "*";
  var peg$c16 = "/";
  var peg$c17 = "%";
  var peg$c18 = "<";
  var peg$c19 = ">";
  var peg$c20 = "|";
  var peg$c21 = "^";
  var peg$c22 = "&";
  var peg$c23 = ":";
  var peg$c24 = "#";
  var peg$c25 = "define";
  var peg$c26 = "include";
  var peg$c27 = "line";
  var peg$c28 = "undef";
  var peg$c29 = "error";
  var peg$c30 = "pragma";
  var peg$c31 = "defined";
  var peg$c32 = "if";
  var peg$c33 = "ifdef";
  var peg$c34 = "ifndef";
  var peg$c35 = "elif";
  var peg$c36 = "else";
  var peg$c37 = "endif";
  var peg$c38 = "version";
  var peg$c39 = "extension";
  var peg$c40 = "0";
  var peg$c41 = "//";
  var peg$c42 = "/*";
  var peg$c43 = "*/";
  var peg$r0 = /^[A-Za-z_]/;
  var peg$r1 = /^[A-Za-z_0-9]/;
  var peg$r2 = /^[uU]/;
  var peg$r3 = /^[1-9]/;
  var peg$r4 = /^[0-7]/;
  var peg$r5 = /^[xX]/;
  var peg$r6 = /^[0-9a-fA-F]/;
  var peg$r7 = /^[0-9]/;
  var peg$r8 = /^[\n\r]/;
  var peg$r9 = /^[^\n\r]/;
  var peg$r10 = /^[ \t]/;
  var peg$e0 = peg$literalExpectation("<<", false);
  var peg$e1 = peg$literalExpectation(">>", false);
  var peg$e2 = peg$literalExpectation("<=", false);
  var peg$e3 = peg$literalExpectation(">=", false);
  var peg$e4 = peg$literalExpectation("==", false);
  var peg$e5 = peg$literalExpectation("!=", false);
  var peg$e6 = peg$literalExpectation("&&", false);
  var peg$e7 = peg$literalExpectation("||", false);
  var peg$e8 = peg$literalExpectation("(", false);
  var peg$e9 = peg$literalExpectation(")", false);
  var peg$e10 = peg$literalExpectation(",", false);
  var peg$e11 = peg$literalExpectation("!", false);
  var peg$e12 = peg$literalExpectation("-", false);
  var peg$e13 = peg$literalExpectation("~", false);
  var peg$e14 = peg$literalExpectation("+", false);
  var peg$e15 = peg$literalExpectation("*", false);
  var peg$e16 = peg$literalExpectation("/", false);
  var peg$e17 = peg$literalExpectation("%", false);
  var peg$e18 = peg$literalExpectation("<", false);
  var peg$e19 = peg$literalExpectation(">", false);
  var peg$e20 = peg$literalExpectation("|", false);
  var peg$e21 = peg$literalExpectation("^", false);
  var peg$e22 = peg$literalExpectation("&", false);
  var peg$e23 = peg$literalExpectation(":", false);
  var peg$e24 = peg$literalExpectation("#", false);
  var peg$e25 = peg$literalExpectation("define", false);
  var peg$e26 = peg$literalExpectation("include", false);
  var peg$e27 = peg$literalExpectation("line", false);
  var peg$e28 = peg$literalExpectation("undef", false);
  var peg$e29 = peg$literalExpectation("error", false);
  var peg$e30 = peg$literalExpectation("pragma", false);
  var peg$e31 = peg$literalExpectation("defined", false);
  var peg$e32 = peg$literalExpectation("if", false);
  var peg$e33 = peg$literalExpectation("ifdef", false);
  var peg$e34 = peg$literalExpectation("ifndef", false);
  var peg$e35 = peg$literalExpectation("elif", false);
  var peg$e36 = peg$literalExpectation("else", false);
  var peg$e37 = peg$literalExpectation("endif", false);
  var peg$e38 = peg$literalExpectation("version", false);
  var peg$e39 = peg$literalExpectation("extension", false);
  var peg$e40 = peg$classExpectation([["A", "Z"], ["a", "z"], "_"], false, false);
  var peg$e41 = peg$classExpectation([["A", "Z"], ["a", "z"], "_", ["0", "9"]], false, false);
  var peg$e42 = peg$otherExpectation("number");
  var peg$e43 = peg$classExpectation(["u", "U"], false, false);
  var peg$e44 = peg$classExpectation([["1", "9"]], false, false);
  var peg$e45 = peg$literalExpectation("0", false);
  var peg$e46 = peg$classExpectation([["0", "7"]], false, false);
  var peg$e47 = peg$classExpectation(["x", "X"], false, false);
  var peg$e48 = peg$classExpectation([["0", "9"], ["a", "f"], ["A", "F"]], false, false);
  var peg$e49 = peg$classExpectation([["0", "9"]], false, false);
  var peg$e50 = peg$otherExpectation("control line");
  var peg$e51 = peg$classExpectation(["\n", "\r"], false, false);
  var peg$e52 = peg$otherExpectation("token string");
  var peg$e53 = peg$classExpectation(["\n", "\r"], true, false);
  var peg$e54 = peg$otherExpectation("text");
  var peg$e55 = peg$otherExpectation("if");
  var peg$e56 = peg$otherExpectation("primary expression");
  var peg$e57 = peg$otherExpectation("unary expression");
  var peg$e58 = peg$otherExpectation("multiplicative expression");
  var peg$e59 = peg$otherExpectation("additive expression");
  var peg$e60 = peg$otherExpectation("shift expression");
  var peg$e61 = peg$otherExpectation("relational expression");
  var peg$e62 = peg$otherExpectation("equality expression");
  var peg$e63 = peg$otherExpectation("and expression");
  var peg$e64 = peg$otherExpectation("exclusive or expression");
  var peg$e65 = peg$otherExpectation("inclusive or expression");
  var peg$e66 = peg$otherExpectation("logical and expression");
  var peg$e67 = peg$otherExpectation("logical or expression");
  var peg$e68 = peg$otherExpectation("constant expression");
  var peg$e69 = peg$otherExpectation("whitespace or comment");
  var peg$e70 = peg$literalExpectation("//", false);
  var peg$e71 = peg$literalExpectation("/*", false);
  var peg$e72 = peg$literalExpectation("*/", false);
  var peg$e73 = peg$anyExpectation();
  var peg$e74 = peg$otherExpectation("whitespace");
  var peg$e75 = peg$classExpectation([" ", "	"], false, false);
  var peg$f0 = function(program, wsEnd) {
    return node("program", { program: program.blocks, wsEnd });
  };
  var peg$f1 = function(token, _) {
    return node("int_constant", { token, wsEnd: _ });
  };
  var peg$f2 = function(token, _) {
    return node("literal", { literal: token, wsEnd: _ });
  };
  var peg$f3 = function(whitespace) {
    return "#";
  };
  var peg$f4 = function(wsStart, token, wsEnd) {
    return node("literal", { literal: token, wsStart, wsEnd });
  };
  var peg$f5 = function(identifier, _) {
    return node("identifier", { identifier, wsEnd: _ });
  };
  var peg$f6 = function(identifier) {
    return node("identifier", { identifier });
  };
  var peg$f7 = function(text2) {
    return node("text", { text: text2.join("") });
  };
  var peg$f8 = function(blocks) {
    return node("segment", { blocks });
  };
  var peg$f9 = function(define, identifier, lp, head, tail) {
    return [head, ...tail.flat()];
  };
  var peg$f10 = function(define, identifier, lp, args, rp, body) {
    return node("define_arguments", { define, identifier, lp, args: args || [], rp, body });
  };
  var peg$f11 = function(define, identifier, body) {
    return node("define", { define, identifier, body });
  };
  var peg$f12 = function(line, value) {
    return node("line", { line, value });
  };
  var peg$f13 = function(undef, identifier) {
    return node("undef", { undef, identifier });
  };
  var peg$f14 = function(error2, message) {
    return node("error", { error: error2, message });
  };
  var peg$f15 = function(pragma, body) {
    return node("pragma", { pragma, body });
  };
  var peg$f16 = function(version, value, profile) {
    return node("version", { version, value, profile });
  };
  var peg$f17 = function(extension, name, colon, behavior) {
    return node("extension", { extension, name, colon, behavior });
  };
  var peg$f18 = function(line, wsEnd) {
    return { ...line, wsEnd };
  };
  var peg$f19 = function(ifLine, wsEnd, body) {
    return { ...ifLine, body, wsEnd };
  };
  var peg$f20 = function(ifPart, token, expression, wsEnd, elseIfBody) {
    return node("elseif", { token, expression, wsEnd, body: elseIfBody });
  };
  var peg$f21 = function(ifPart, elseIfParts, token, wsEnd, elseBody) {
    return node("else", { token, wsEnd, body: elseBody });
  };
  var peg$f22 = function(ifPart, elseIfParts, elsePart, endif, wsEnd) {
    return node("conditional", { ifPart, elseIfParts, elsePart, endif, wsEnd });
  };
  var peg$f23 = function(token, identifier) {
    return node("ifdef", { token, identifier });
  };
  var peg$f24 = function(token, identifier) {
    return node("ifndef", { token, identifier });
  };
  var peg$f25 = function(token, expression) {
    return node("if", { token, expression });
  };
  var peg$f26 = function(lp, expression, rp) {
    return node("group", { lp, expression, rp });
  };
  var peg$f27 = function(operator, lp, identifier, rp) {
    return node("unary_defined", { operator, lp, identifier, rp });
  };
  var peg$f28 = function(operator, expression) {
    return node("unary", { operator, expression });
  };
  var peg$f29 = function(head, tail) {
    return leftAssociate2(head, tail);
  };
  var peg$f30 = function(w, rest) {
    return collapse2(w, rest);
  };
  var peg$f31 = function(a, x, cc) {
    return xnil2(x, cc);
  };
  var peg$f32 = function(a, d) {
    return xnil2(a, d.flat());
  };
  var peg$f33 = function(i) {
    return i;
  };
  var peg$f34 = function(_) {
    return _;
  };
  var peg$currPos = 0;
  var peg$savedPos = 0;
  var peg$posDetailsCache = [{ line: 1, column: 1 }];
  var peg$maxFailPos = 0;
  var peg$maxFailExpected = [];
  var peg$silentFails = 0;
  var peg$resultsCache = {};
  var peg$result;
  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error(`Can't start parsing from rule "` + options.startRule + '".');
    }
    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }
  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }
  function offset() {
    return peg$savedPos;
  }
  function range() {
    return {
      source: peg$source,
      start: peg$savedPos,
      end: peg$currPos
    };
  }
  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }
  function expected(description, location2) {
    location2 = location2 !== void 0 ? location2 : peg$computeLocation(peg$savedPos, peg$currPos);
    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location2
    );
  }
  function error(message, location2) {
    location2 = location2 !== void 0 ? location2 : peg$computeLocation(peg$savedPos, peg$currPos);
    throw peg$buildSimpleError(message, location2);
  }
  function peg$literalExpectation(text2, ignoreCase) {
    return { type: "literal", text: text2, ignoreCase };
  }
  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts, inverted, ignoreCase };
  }
  function peg$anyExpectation() {
    return { type: "any" };
  }
  function peg$endExpectation() {
    return { type: "end" };
  }
  function peg$otherExpectation(description) {
    return { type: "other", description };
  }
  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos];
    var p;
    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }
      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };
      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }
        p++;
      }
      peg$posDetailsCache[pos] = details;
      return details;
    }
  }
  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos);
    var endPosDetails = peg$computePosDetails(endPos);
    return {
      source: peg$source,
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }
  function peg$fail(expected2) {
    if (peg$currPos < peg$maxFailPos) {
      return;
    }
    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }
    peg$maxFailExpected.push(expected2);
  }
  function peg$buildSimpleError(message, location2) {
    return new peg$SyntaxError2(message, null, null, location2);
  }
  function peg$buildStructuredError(expected2, found, location2) {
    return new peg$SyntaxError2(
      peg$SyntaxError2.buildMessage(expected2, found),
      expected2,
      found,
      location2
    );
  }
  function peg$parsestart() {
    var s0;
    var key = peg$currPos * 76 + 0;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parseprogram();
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseprogram() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 1;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parsetext_or_control_lines();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f0(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseINTCONSTANT() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 2;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parseinteger_constant();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f1(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLEFT_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 3;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c0) {
      s1 = peg$c0;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e0);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRIGHT_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 4;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c1) {
      s1 = peg$c1;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e1);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLE_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 5;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c2) {
      s1 = peg$c2;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e2);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseGE_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 6;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c3) {
      s1 = peg$c3;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e3);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseEQ_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 7;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c4) {
      s1 = peg$c4;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e4);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseNE_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 8;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c5) {
      s1 = peg$c5;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e5);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseAND_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 9;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c6) {
      s1 = peg$c6;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e6);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseOR_OP() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 10;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c7) {
      s1 = peg$c7;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e7);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLEFT_PAREN() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 11;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c8;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e8);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRIGHT_PAREN() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 12;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 41) {
      s1 = peg$c9;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e9);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCOMMA() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 13;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 44) {
      s1 = peg$c10;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e10);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseBANG() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 14;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 33) {
      s1 = peg$c11;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e11);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDASH() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 15;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 45) {
      s1 = peg$c12;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e12);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseTILDE() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 16;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 126) {
      s1 = peg$c13;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e13);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsePLUS() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 17;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 43) {
      s1 = peg$c14;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e14);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSTAR() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 18;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 42) {
      s1 = peg$c15;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e15);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseSLASH() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 19;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 47) {
      s1 = peg$c16;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e16);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsePERCENT() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 20;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 37) {
      s1 = peg$c17;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e17);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLEFT_ANGLE() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 21;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 60) {
      s1 = peg$c18;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e18);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseRIGHT_ANGLE() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 22;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 62) {
      s1 = peg$c19;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e19);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseVERTICAL_BAR() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 23;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 124) {
      s1 = peg$c20;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e20);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCARET() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 24;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 94) {
      s1 = peg$c21;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e21);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseAMPERSAND() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 25;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 38) {
      s1 = peg$c22;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e22);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseCOLON() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 26;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 58) {
      s1 = peg$c23;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e23);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f2(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseHASH() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 27;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 35) {
      s2 = peg$c24;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e24);
      }
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f3(s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDEFINE() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 28;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 6) === peg$c25) {
        s5 = peg$c25;
        peg$currPos += 6;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e25);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseINCLUDE() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 29;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 7) === peg$c26) {
        s5 = peg$c26;
        peg$currPos += 7;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e26);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseLINE() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 30;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 4) === peg$c27) {
        s5 = peg$c27;
        peg$currPos += 4;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e27);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseUNDEF() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 31;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 5) === peg$c28) {
        s5 = peg$c28;
        peg$currPos += 5;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e28);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseERROR() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 32;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 5) === peg$c29) {
        s5 = peg$c29;
        peg$currPos += 5;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e29);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsePRAGMA() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 33;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 6) === peg$c30) {
        s5 = peg$c30;
        peg$currPos += 6;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e30);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseDEFINED() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 76 + 34;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    if (input.substr(peg$currPos, 7) === peg$c31) {
      s2 = peg$c31;
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e31);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIF() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 35;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c32) {
        s5 = peg$c32;
        peg$currPos += 2;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e32);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIFDEF() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 36;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 5) === peg$c33) {
        s5 = peg$c33;
        peg$currPos += 5;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e33);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIFNDEF() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 37;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 6) === peg$c34) {
        s5 = peg$c34;
        peg$currPos += 6;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e34);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseELIF() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 38;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 4) === peg$c35) {
        s5 = peg$c35;
        peg$currPos += 4;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e35);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseELSE() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 39;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 4) === peg$c36) {
        s5 = peg$c36;
        peg$currPos += 4;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e36);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseENDIF() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 40;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 5) === peg$c37) {
        s5 = peg$c37;
        peg$currPos += 5;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e37);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseVERSION() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 41;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 7) === peg$c38) {
        s5 = peg$c38;
        peg$currPos += 7;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e38);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseEXTENSION() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 42;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = peg$currPos;
    s4 = peg$parseHASH();
    if (s4 !== peg$FAILED) {
      if (input.substr(peg$currPos, 9) === peg$c39) {
        s5 = peg$c39;
        peg$currPos += 9;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e39);
        }
      }
      if (s5 !== peg$FAILED) {
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    if (s3 !== peg$FAILED) {
      s2 = input.substring(s2, peg$currPos);
    } else {
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseterminal();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIDENTIFIER() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 43;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$currPos;
    if (peg$r0.test(input.charAt(peg$currPos))) {
      s3 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e40);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = [];
      if (peg$r1.test(input.charAt(peg$currPos))) {
        s5 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e41);
        }
      }
      while (s5 !== peg$FAILED) {
        s4.push(s5);
        if (peg$r1.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e41);
          }
        }
      }
      s3 = [s3, s4];
      s2 = s3;
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f5(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseIDENTIFIER_NO_WS() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 44;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$currPos;
    if (peg$r0.test(input.charAt(peg$currPos))) {
      s3 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e40);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = [];
      if (peg$r1.test(input.charAt(peg$currPos))) {
        s5 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e41);
        }
      }
      while (s5 !== peg$FAILED) {
        s4.push(s5);
        if (peg$r1.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e41);
          }
        }
      }
      s3 = [s3, s4];
      s2 = s3;
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f6(s1);
    }
    s0 = s1;
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinteger_constant() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 76 + 45;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parsedecimal_constant();
    if (s2 !== peg$FAILED) {
      s3 = peg$parseinteger_suffix();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s2 = [s2, s3];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseoctal_constant();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseinteger_suffix();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$parsehexadecimal_constant();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinteger_suffix();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e42);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinteger_suffix() {
    var s0;
    var key = peg$currPos * 76 + 46;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    if (peg$r2.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e43);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsedecimal_constant() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 76 + 47;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    if (peg$r3.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e44);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      s4 = peg$parsedigit();
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parsedigit();
      }
      s2 = [s2, s3];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseoctal_constant() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 76 + 48;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 48) {
      s1 = peg$c40;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e45);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      if (peg$r4.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e46);
        }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$r4.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e46);
          }
        }
      }
      s1 = [s1, s2];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsehexadecimal_constant() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 76 + 49;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 48) {
      s1 = peg$c40;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e45);
      }
    }
    if (s1 !== peg$FAILED) {
      if (peg$r5.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e47);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        if (peg$r6.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e48);
          }
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$r6.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e48);
            }
          }
        }
        s1 = [s1, s2, s3];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsedigit() {
    var s0;
    var key = peg$currPos * 76 + 50;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    if (peg$r7.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e49);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsetext_or_control_lines() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 76 + 51;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parsecontrol_line();
    if (s2 === peg$FAILED) {
      s2 = peg$currPos;
      s3 = [];
      s4 = peg$parsetext();
      if (s4 !== peg$FAILED) {
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parsetext();
        }
      } else {
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        peg$savedPos = s2;
        s3 = peg$f7(s3);
      }
      s2 = s3;
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsecontrol_line();
        if (s2 === peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = peg$parsetext();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsetext();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s2;
            s3 = peg$f7(s3);
          }
          s2 = s3;
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f8(s1);
    }
    s0 = s1;
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsecontrol_line() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;
    var key = peg$currPos * 76 + 52;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parseconditional();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseDEFINE();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseIDENTIFIER_NO_WS();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseLEFT_PAREN();
          if (s4 !== peg$FAILED) {
            s5 = peg$currPos;
            s6 = peg$parseIDENTIFIER();
            if (s6 !== peg$FAILED) {
              s7 = [];
              s8 = peg$currPos;
              s9 = peg$parseCOMMA();
              if (s9 !== peg$FAILED) {
                s10 = peg$parseIDENTIFIER();
                if (s10 !== peg$FAILED) {
                  s9 = [s9, s10];
                  s8 = s9;
                } else {
                  peg$currPos = s8;
                  s8 = peg$FAILED;
                }
              } else {
                peg$currPos = s8;
                s8 = peg$FAILED;
              }
              while (s8 !== peg$FAILED) {
                s7.push(s8);
                s8 = peg$currPos;
                s9 = peg$parseCOMMA();
                if (s9 !== peg$FAILED) {
                  s10 = peg$parseIDENTIFIER();
                  if (s10 !== peg$FAILED) {
                    s9 = [s9, s10];
                    s8 = s9;
                  } else {
                    peg$currPos = s8;
                    s8 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s8;
                  s8 = peg$FAILED;
                }
              }
              peg$savedPos = s5;
              s5 = peg$f9(s2, s3, s4, s6, s7);
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
            if (s5 === peg$FAILED) {
              s5 = null;
            }
            s6 = peg$parseRIGHT_PAREN();
            if (s6 !== peg$FAILED) {
              s7 = peg$parsetoken_string();
              if (s7 === peg$FAILED) {
                s7 = null;
              }
              peg$savedPos = s1;
              s1 = peg$f10(s2, s3, s4, s5, s6, s7);
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        s2 = peg$parseDEFINE();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseIDENTIFIER();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsetoken_string();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            peg$savedPos = s1;
            s1 = peg$f11(s2, s3, s4);
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          s2 = peg$parseLINE();
          if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            s4 = [];
            s5 = peg$parsedigit();
            if (s5 !== peg$FAILED) {
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parsedigit();
              }
            } else {
              s4 = peg$FAILED;
            }
            if (s4 !== peg$FAILED) {
              s3 = input.substring(s3, peg$currPos);
            } else {
              s3 = s4;
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s1;
              s1 = peg$f12(s2, s3);
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
          if (s1 === peg$FAILED) {
            s1 = peg$currPos;
            s2 = peg$parseUNDEF();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseIDENTIFIER();
              if (s3 !== peg$FAILED) {
                peg$savedPos = s1;
                s1 = peg$f13(s2, s3);
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
            if (s1 === peg$FAILED) {
              s1 = peg$currPos;
              s2 = peg$parseERROR();
              if (s2 !== peg$FAILED) {
                s3 = peg$parsetoken_string();
                if (s3 !== peg$FAILED) {
                  peg$savedPos = s1;
                  s1 = peg$f14(s2, s3);
                } else {
                  peg$currPos = s1;
                  s1 = peg$FAILED;
                }
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
              if (s1 === peg$FAILED) {
                s1 = peg$currPos;
                s2 = peg$parsePRAGMA();
                if (s2 !== peg$FAILED) {
                  s3 = peg$parsetoken_string();
                  if (s3 !== peg$FAILED) {
                    peg$savedPos = s1;
                    s1 = peg$f15(s2, s3);
                  } else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s1;
                  s1 = peg$FAILED;
                }
                if (s1 === peg$FAILED) {
                  s1 = peg$currPos;
                  s2 = peg$parseVERSION();
                  if (s2 !== peg$FAILED) {
                    s3 = peg$parseinteger_constant();
                    if (s3 !== peg$FAILED) {
                      s4 = peg$parsetoken_string();
                      if (s4 === peg$FAILED) {
                        s4 = null;
                      }
                      peg$savedPos = s1;
                      s1 = peg$f16(s2, s3, s4);
                    } else {
                      peg$currPos = s1;
                      s1 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                  }
                  if (s1 === peg$FAILED) {
                    s1 = peg$currPos;
                    s2 = peg$parseEXTENSION();
                    if (s2 !== peg$FAILED) {
                      s3 = peg$parseIDENTIFIER();
                      if (s3 !== peg$FAILED) {
                        s4 = peg$parseCOLON();
                        if (s4 !== peg$FAILED) {
                          s5 = peg$parsetoken_string();
                          if (s5 !== peg$FAILED) {
                            peg$savedPos = s1;
                            s1 = peg$f17(s2, s3, s4, s5);
                          } else {
                            peg$currPos = s1;
                            s1 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s1;
                          s1 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s1;
                        s1 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s1;
                      s1 = peg$FAILED;
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        if (peg$r8.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e51);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f18(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e50);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsetoken_string() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 53;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = [];
    if (peg$r9.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e53);
      }
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$r9.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e53);
          }
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e52);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsetext() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 54;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$currPos;
    peg$silentFails++;
    s3 = peg$currPos;
    s4 = peg$parsewhitespace();
    if (s4 === peg$FAILED) {
      s4 = null;
    }
    if (input.charCodeAt(peg$currPos) === 35) {
      s5 = peg$c24;
      peg$currPos++;
    } else {
      s5 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e24);
      }
    }
    if (s5 !== peg$FAILED) {
      s4 = [s4, s5];
      s3 = s4;
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    peg$silentFails--;
    if (s3 === peg$FAILED) {
      s2 = void 0;
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      if (peg$r9.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e53);
        }
      }
      if (s4 !== peg$FAILED) {
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$r9.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e53);
            }
          }
        }
      } else {
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        if (peg$r8.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e51);
          }
        }
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        s2 = [s2, s3, s4];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 === peg$FAILED) {
      if (peg$r8.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e51);
        }
      }
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e54);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseconditional() {
    var s0, s1, s2, s3, s4, s5, s6, s7;
    var key = peg$currPos * 76 + 55;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parseif_line();
    if (s2 !== peg$FAILED) {
      if (peg$r8.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e51);
        }
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parsetext_or_control_lines();
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        peg$savedPos = s1;
        s1 = peg$f19(s2, s3, s4);
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseELIF();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseconstant_expression();
        if (s5 !== peg$FAILED) {
          if (peg$r8.test(input.charAt(peg$currPos))) {
            s6 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e51);
            }
          }
          if (s6 !== peg$FAILED) {
            s7 = peg$parsetext_or_control_lines();
            if (s7 === peg$FAILED) {
              s7 = null;
            }
            peg$savedPos = s3;
            s3 = peg$f20(s1, s4, s5, s6, s7);
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseELIF();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseconstant_expression();
          if (s5 !== peg$FAILED) {
            if (peg$r8.test(input.charAt(peg$currPos))) {
              s6 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e51);
              }
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$parsetext_or_control_lines();
              if (s7 === peg$FAILED) {
                s7 = null;
              }
              peg$savedPos = s3;
              s3 = peg$f20(s1, s4, s5, s6, s7);
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      s3 = peg$currPos;
      s4 = peg$parseELSE();
      if (s4 !== peg$FAILED) {
        if (peg$r8.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e51);
          }
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parsetext_or_control_lines();
          if (s6 === peg$FAILED) {
            s6 = null;
          }
          peg$savedPos = s3;
          s3 = peg$f21(s1, s2, s4, s5, s6);
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parseENDIF();
      if (s4 !== peg$FAILED) {
        if (peg$r8.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e51);
          }
        }
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f22(s1, s2, s3, s4, s5);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseif_line() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 56;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseIFDEF();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseIDENTIFIER();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f23(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseIFNDEF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseIDENTIFIER();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f24(s1, s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseIF();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseconstant_expression();
          if (s2 === peg$FAILED) {
            s2 = null;
          }
          peg$savedPos = s0;
          s0 = peg$f25(s1, s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e55);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseprimary_expression() {
    var s0, s1, s2, s3;
    var key = peg$currPos * 76 + 57;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parseINTCONSTANT();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseLEFT_PAREN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseconstant_expression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseRIGHT_PAREN();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f26(s1, s2, s3);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseIDENTIFIER();
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e56);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseunary_expression() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 76 + 58;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseDEFINED();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseLEFT_PAREN();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = peg$parseIDENTIFIER();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseRIGHT_PAREN();
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f27(s1, s2, s3, s4);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parsePLUS();
      if (s1 === peg$FAILED) {
        s1 = peg$parseDASH();
        if (s1 === peg$FAILED) {
          s1 = peg$parseBANG();
          if (s1 === peg$FAILED) {
            s1 = peg$parseTILDE();
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseunary_expression();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f28(s1, s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseprimary_expression();
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e57);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsemultiplicative_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 59;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseunary_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseSTAR();
      if (s4 === peg$FAILED) {
        s4 = peg$parseSLASH();
        if (s4 === peg$FAILED) {
          s4 = peg$parsePERCENT();
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parseunary_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseSTAR();
        if (s4 === peg$FAILED) {
          s4 = peg$parseSLASH();
          if (s4 === peg$FAILED) {
            s4 = peg$parsePERCENT();
          }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseunary_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e58);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseadditive_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 60;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsemultiplicative_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parsePLUS();
      if (s4 === peg$FAILED) {
        s4 = peg$parseDASH();
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parsemultiplicative_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parsePLUS();
        if (s4 === peg$FAILED) {
          s4 = peg$parseDASH();
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsemultiplicative_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e59);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseshift_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 61;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseadditive_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseRIGHT_OP();
      if (s4 === peg$FAILED) {
        s4 = peg$parseLEFT_OP();
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parseadditive_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseRIGHT_OP();
        if (s4 === peg$FAILED) {
          s4 = peg$parseLEFT_OP();
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseadditive_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e60);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parserelational_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 62;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseshift_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseLE_OP();
      if (s4 === peg$FAILED) {
        s4 = peg$parseGE_OP();
        if (s4 === peg$FAILED) {
          s4 = peg$parseLEFT_ANGLE();
          if (s4 === peg$FAILED) {
            s4 = peg$parseRIGHT_ANGLE();
          }
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parseshift_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseLE_OP();
        if (s4 === peg$FAILED) {
          s4 = peg$parseGE_OP();
          if (s4 === peg$FAILED) {
            s4 = peg$parseLEFT_ANGLE();
            if (s4 === peg$FAILED) {
              s4 = peg$parseRIGHT_ANGLE();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseshift_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e61);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseequality_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 63;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parserelational_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseEQ_OP();
      if (s4 === peg$FAILED) {
        s4 = peg$parseNE_OP();
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parserelational_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseEQ_OP();
        if (s4 === peg$FAILED) {
          s4 = peg$parseNE_OP();
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parserelational_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e62);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseand_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 64;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseequality_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseAMPERSAND();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseequality_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseAMPERSAND();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseequality_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e63);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseexclusive_or_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 65;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseand_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseCARET();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseand_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseCARET();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseand_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e64);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseinclusive_or_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 66;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseexclusive_or_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseVERTICAL_BAR();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseexclusive_or_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseVERTICAL_BAR();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseexclusive_or_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e65);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parselogical_and_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 67;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseinclusive_or_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseAND_OP();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseinclusive_or_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseAND_OP();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseinclusive_or_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e66);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parselogical_or_expression() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 68;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parselogical_and_expression();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseOR_OP();
      if (s4 !== peg$FAILED) {
        s5 = peg$parselogical_and_expression();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseOR_OP();
        if (s4 !== peg$FAILED) {
          s5 = peg$parselogical_and_expression();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e67);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseconstant_expression() {
    var s0, s1;
    var key = peg$currPos * 76 + 69;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$parselogical_or_expression();
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e68);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parse_() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 70;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parsewhitespace();
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    s2 = [];
    s3 = peg$currPos;
    s4 = peg$parsecomment();
    if (s4 !== peg$FAILED) {
      s5 = peg$parsewhitespace();
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      s4 = [s4, s5];
      s3 = s4;
    } else {
      peg$currPos = s3;
      s3 = peg$FAILED;
    }
    while (s3 !== peg$FAILED) {
      s2.push(s3);
      s3 = peg$currPos;
      s4 = peg$parsecomment();
      if (s4 !== peg$FAILED) {
        s5 = peg$parsewhitespace();
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s4 = [s4, s5];
        s3 = s4;
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
    }
    peg$savedPos = s0;
    s0 = peg$f30(s1, s2);
    peg$silentFails--;
    s1 = peg$FAILED;
    if (peg$silentFails === 0) {
      peg$fail(peg$e69);
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsecomment() {
    var s0, s1, s2, s3, s4, s5;
    var key = peg$currPos * 76 + 71;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$parsesingle_comment();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parsemultiline_comment();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsewhitespace();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsecomment();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s3;
            s3 = peg$f31(s1, s4, s5);
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsewhitespace();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsecomment();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s3;
              s3 = peg$f31(s1, s4, s5);
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        peg$savedPos = s0;
        s0 = peg$f32(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsesingle_comment() {
    var s0, s1, s2, s3, s4;
    var key = peg$currPos * 76 + 72;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c41) {
      s2 = peg$c41;
      peg$currPos += 2;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e70);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      if (peg$r9.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e53);
        }
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        if (peg$r9.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e53);
          }
        }
      }
      s2 = [s2, s3];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsemultiline_comment() {
    var s0, s1, s2, s3, s4, s5, s6;
    var key = peg$currPos * 76 + 73;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c42) {
      s2 = peg$c42;
      peg$currPos += 2;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e71);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      s4 = peg$currPos;
      s5 = peg$currPos;
      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c43) {
        s6 = peg$c43;
        peg$currPos += 2;
      } else {
        s6 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e72);
        }
      }
      peg$silentFails--;
      if (s6 === peg$FAILED) {
        s5 = void 0;
      } else {
        peg$currPos = s5;
        s5 = peg$FAILED;
      }
      if (s5 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s6 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e73);
          }
        }
        if (s6 !== peg$FAILED) {
          peg$savedPos = s4;
          s4 = peg$f33(s6);
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$currPos;
        s5 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c43) {
          s6 = peg$c43;
          peg$currPos += 2;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e72);
          }
        }
        peg$silentFails--;
        if (s6 === peg$FAILED) {
          s5 = void 0;
        } else {
          peg$currPos = s5;
          s5 = peg$FAILED;
        }
        if (s5 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s6 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e73);
            }
          }
          if (s6 !== peg$FAILED) {
            peg$savedPos = s4;
            s4 = peg$f33(s6);
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      }
      if (input.substr(peg$currPos, 2) === peg$c43) {
        s4 = peg$c43;
        peg$currPos += 2;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e72);
        }
      }
      if (s4 !== peg$FAILED) {
        s2 = [s2, s3, s4];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parsewhitespace() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 74;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    peg$silentFails++;
    s0 = peg$currPos;
    s1 = [];
    if (peg$r10.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e75);
      }
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$r10.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e75);
          }
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e74);
      }
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  function peg$parseterminal() {
    var s0, s1, s2;
    var key = peg$currPos * 76 + 75;
    var cached = peg$resultsCache[key];
    if (cached) {
      peg$currPos = cached.nextPos;
      return cached.result;
    }
    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    if (peg$r1.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e41);
      }
    }
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f34(s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };
    return s0;
  }
  input = unescapeSrc(input);
  const node = (type, attrs) => ({
    type,
    ...attrs
  });
  const xnil2 = (...args) => args.flat().filter(
    (e) => e !== void 0 && e !== null && e !== "" && e.length !== 0
  );
  const ifOnly2 = (arr) => arr.length > 1 ? arr : arr[0];
  const collapse2 = (...args) => ifOnly2(xnil2(args));
  const leftAssociate2 = (...nodes) => nodes.flat().reduce((current, [operator, expr]) => ({
    type: "binary",
    operator,
    left: current,
    right: expr
  }));
  peg$result = peg$startRuleFunction();
  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }
    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

// dist/preprocessor/index.js
var parse2 = function(src, options) {
  return formatError(preprocessor_parser_exports)((options === null || options === void 0 ? void 0 : options.preserveComments) ? src : preprocessComments(src), options);
};
var preprocess = function(src, options) {
  return generator_default2(preprocessAst(parse2(src, options)));
};
var preprocessor_default = preprocess;
export {
  GlslSyntaxError,
  generator_default as generate,
  parser_default as parse,
  parser_exports as parser,
  preprocessor_default as preprocess
};
//# sourceMappingURL=glsl-parser.js.map
