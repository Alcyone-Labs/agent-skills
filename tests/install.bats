#!/usr/bin/env bats

setup() {
  TEMP_DIR=$(mktemp -d)
  export TEMP_DIR
  export REAL_HOME="$HOME"
  export HOME="$TEMP_DIR/home"
  mkdir -p "$HOME"
}

teardown() {
  rm -rf "$TEMP_DIR"
  export HOME="$REAL_HOME"
}

@test "install.sh runs with --self --help without error" {
  run bash "$BATS_TEST_DIRNAME/../install.sh" --self --help
  [ "$status" -eq 0 ]
}

@test "install.sh creates directories with --self --local" {
  cd "$TEMP_DIR"
  run bash "$BATS_TEST_DIRNAME/../install.sh" --self --local --antigravity
  [ "$status" -eq 0 ]
  [ -d ".antigravity/skills" ]
}

@test "install.sh creates global directories with --self --global" {
  cd "$TEMP_DIR"
  run bash "$BATS_TEST_DIRNAME/../install.sh" --self --global --antigravity
  [ "$status" -eq 0 ]
  [ -d "$HOME/.antigravity/skills" ]
}

@test "install.sh installs specific agent with flag --claude" {
  cd "$TEMP_DIR"
  run bash "$BATS_TEST_DIRNAME/../install.sh" --self --global --claude
  [ "$status" -eq 0 ]
  [ -d "$HOME/.claude/skills" ]
}

@test "install.sh installs multiple agents with flags --opencode --gemini" {
  cd "$TEMP_DIR"
  run bash "$BATS_TEST_DIRNAME/../install.sh" --self --global --opencode --gemini
  [ "$status" -eq 0 ]
  [ -d "$HOME/.config/opencode/skills" ]
  [ -d "$HOME/.gemini/skills" ]
}

@test "install.sh updates .gitignore on local install" {
  cd "$TEMP_DIR"
  touch ".gitignore"
  run bash -c "printf '2\n6\n8\n3\ny\n' | bash '$BATS_TEST_DIRNAME/../install.sh' --self"
  [ "$status" -eq 0 ]
  grep -q ".antigravity/" ".gitignore"
}

@test "install.sh handles --factory as alias for --droid" {
  cd "$TEMP_DIR"
  run bash "$BATS_TEST_DIRNAME/../install.sh" --self --global --factory
  [ "$status" -eq 0 ]
  [ -d "$HOME/.factory/skills" ]
}

@test "install.sh interactive: global install defaults to agents" {
  cd "$TEMP_DIR"
  run bash -c "printf '1\n5\n8\n' | bash '$BATS_TEST_DIRNAME/../install.sh' --self"
  [ "$status" -eq 0 ]
  [ -d "$HOME/.config/agents/skills" ]
}

@test "install.sh interactive: local install toggles agents correctly" {
  cd "$TEMP_DIR"
  run bash -c "printf '2\n1\n8\nn\n' | bash '$BATS_TEST_DIRNAME/../install.sh' --self"
  [ "$status" -eq 0 ]
  [ -d ".opencode/skills" ]
}

@test "install.sh interactive: select all installs multiple agents" {
  cd "$TEMP_DIR"
  run bash -c "printf '1\n7\n8\n' | bash '$BATS_TEST_DIRNAME/../install.sh' --self"
  [ "$status" -eq 0 ]
  [ -d "$HOME/.config/agents/skills" ]
  [ -d "$HOME/.config/opencode/skills" ]
}
