export function json(strings: TemplateStringsArray, ...values: any[]) {
  return strings.reduce((result, string, i) => {
    const value = values[i];
    const jsonValue = value !== undefined ? JSON.stringify(value) : "";
    return result + string + jsonValue;
  }, "");
}
