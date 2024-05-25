#!/usr/bin/env bash

args=("$@")

out_dir="$(pwd)/dist";

# Clean output directory
if [ -d "${out_dir}" ]; then
  rm -rf "${out_dir}";
fi

projects=(
  "src/core"
  "src/engine"
)

exit_with_error() {
  echo "${1}" >&2
  exit 1
}

for project_dir in "${projects[@]}"; do
  echo "### BUILDING '${project_dir}' ###"
  pushd "$project_dir" || exit_with_error "Project not found: ${project_dir}";
  wasm-pack build --out-dir "${out_dir}" --scope 'fantasy-console' "${args[@]}";
  popd > /dev/null || exit_with_error "failed to popd";

  echo "### Successfully built '${project_dir}' ###"
done