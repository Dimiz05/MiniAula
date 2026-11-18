export function formatZodIssues(error) {
  return error.issues.flatMap((issue) => {
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map((key) => ({
        campo: key,
        mensaje: 'Campo no permitido.',
      }));
    }

    return [{
      campo: issue.path.length > 0 ? issue.path.join('.') : null,
      mensaje: issue.message,
    }];
  });
}
