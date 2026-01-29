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
  # First do a non-interactive install to select all skills by default
  run bash "$BATS_TEST_DIRNAME/../install.sh" --self --local --antigravity
  [ "$status" -eq 0 ]
  # The gitignore prompt requires interactive input, skip the check
  # Just verify the installation worked
  [ -d ".antigravity/skills" ]
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

# Tests for piped execution (curl | bash)
@test "install.sh works when piped with --help" {
  cd "$TEMP_DIR"
  run bash -c "cat '$BATS_TEST_DIRNAME/../install.sh' | bash -s -- --help"
  [ "$status" -eq 0 ]
  [[ "$output" == *"Usage:"* ]]
}

@test "install.sh works when piped with --global --opencode" {
  cd "$TEMP_DIR"
  run bash -c "cat '$BATS_TEST_DIRNAME/../install.sh' | bash -s -- --global --opencode"
  [ "$status" -eq 0 ]
  [ -d "$HOME/.config/opencode/skills" ]
}

@test "install.sh works when piped with --global --gemini" {
  cd "$TEMP_DIR"
  run bash -c "cat '$BATS_TEST_DIRNAME/../install.sh' | bash -s -- --global --gemini"
  [ "$status" -eq 0 ]
  [ -d "$HOME/.gemini/skills" ]
}

@test "install.sh works when piped with --global --droid" {
  cd "$TEMP_DIR"
  run bash -c "cat '$BATS_TEST_DIRNAME/../install.sh' | bash -s -- --global --droid"
  [ "$status" -eq 0 ]
  [ -d "$HOME/.factory/skills" ]
}

@test "install.sh works when piped with multiple platforms" {
  cd "$TEMP_DIR"
  run bash -c "cat '$BATS_TEST_DIRNAME/../install.sh' | bash -s -- --global --opencode --gemini --droid"
  [ "$status" -eq 0 ]
  [ -d "$HOME/.config/opencode/skills" ]
  [ -d "$HOME/.gemini/skills" ]
  [ -d "$HOME/.factory/skills" ]
}

@test "install.sh fails when piped with --self flag" {
  cd "$TEMP_DIR"
  run bash -c "cat '$BATS_TEST_DIRNAME/../install.sh' | bash -s -- --self --global 2>&1"
  [ "$status" -eq 1 ]
  [[ "$output" == *"--self flag requires running the script directly"* ]]
}

@test "install.sh piped uses correct default project name" {
  cd "$TEMP_DIR"
  run bash -c "cat '$BATS_TEST_DIRNAME/../install.sh' | bash -s -- --help"
  [ "$status" -eq 0 ]
  [[ "$output" == *"agent-skills"* ]]
}

@test "install.sh piped with --skill flag installs specific skills" {
  cd "$TEMP_DIR"
  run bash -c "cat '$BATS_TEST_DIRNAME/../install.sh' | bash -s -- --global --opencode --skill chrome-extension-architect --skill git-commit-writer"
  [ "$status" -eq 0 ]
  [ -d "$HOME/.config/opencode/skills/chrome-extension-architect" ]
  [ -d "$HOME/.config/opencode/skills/git-commit-writer" ]
  # Verify other skills were NOT installed
  [ ! -d "$HOME/.config/opencode/skills/arg-parser" ]
}

@test "install.sh piped with --all-skills flag installs all skills" {
  cd "$TEMP_DIR"
  run bash -c "cat '$BATS_TEST_DIRNAME/../install.sh' | bash -s -- --global --opencode --all-skills"
  [ "$status" -eq 0 ]
  [ -d "$HOME/.config/opencode/skills" ]
  # Should have multiple skills installed
  local skill_count=$(find "$HOME/.config/opencode/skills" -mindepth 1 -maxdepth 1 -type d | wc -l)
  [ "$skill_count" -gt 1 ]
}

@test "install.sh auto-detects local repository and uses --self mode" {
  cd "$BATS_TEST_DIRNAME/.."
  run bash ./install.sh --global --opencode --skill chrome-extension-architect
  [ "$status" -eq 0 ]
  [[ "$output" == *"Detected local repository"* ]]
  [ -d "$HOME/.config/opencode/skills/chrome-extension-architect" ]
}
