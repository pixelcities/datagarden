export enum ExecutionError {
  Retry = 0,
  Failure = 1,
  Integrity = 2,
}

export enum DataType {
  String = "String",
  AbsoluteInteger = "Absolute Integer",

  // Is actually float, but decimal has wider recognition
  AbsoluteDecimal = "Absolute Decimal",
  RelativeInteger = "Relative Integer",
  RelativeDecimal = "Relative Decimal",
  Other = "Other",
}

export const SqlTypeMap: {[key: string]: string} = {
  String: "VARCHAR",
  AbsoluteInteger: "INT",
  AbsoluteDecimal: "FLOAT",
  RelativeInteger: "INT",
  RelativeDecimal: "FLOAT",
  Other: "VARCHAR"
}

export enum StringFunction1 {
  length = "length",
  lower = "lower",
  ltrim = "ltrim",
  rtrim = "rtrim",
  trim = "trim",
  upper = "upper"
}

export enum MathFunction0 {
  random = "random"
}

export enum MathFunction1 {
  abs = "abs",
  acos = "acos",
  asin = "asin",
  atan = "atan",
  ceil = "ceil",
  cos = "cos",
  exp = "exp",
  floor = "floor",
  ln = "ln",
  log10 = "log10",
  log2 = "log2",
  round = "round",
  signum = "signum",
  sin = "sin",
  sqrt = "sqrt",
  tan = "tan",
  trunc = "trunc"
}
