#!/usr/bin/env bash
set -euo pipefail

# === CONFIGURATION ===
REPO_URL="https://github.com/Alcyone-Labs/agent-skills.git"
# Default project name - use BASH_SOURCE if available, otherwise hardcoded default
if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
  PROJECT_NAME="${PROJECT_NAME:-$(basename "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")}"
else
  PROJECT_NAME="${PROJECT_NAME:-agent-skills}"
fi
# ======================

# Helper to normalize platform name to folder name
normalize_platform() {
  case "$1" in
    "OpenCode") echo "opencode" ;;
    "Gemini CLI") echo "gemini" ;;
    "Claude") echo "claude" ;;
    "FactoryAI Droid") echo "droid" ;;
    "Agents") echo "agents" ;;
    "Antigravity") echo "antigravity" ;;
    *) echo "unknown" ;;
  esac
}

usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Install skills from ${PROJECT_NAME} collection.

Options:
  -s, --self      Install from local filesystem (for testing/dev)
  -g, --global    Install globally (user scope ~/)
  -l, --local     Install locally (project ./)
  -h, --help      Show this help message

Platform Flags (at least one required when piping):
  --opencode      Target OpenCode only
  --gemini        Target Gemini CLI only
  --claude        Target Claude only
  --droid         Target FactoryAI Droid only
  --agents        Target Agents only (Default if no flags)
  --antigravity   Target Antigravity only

Skill Selection (optional, when piping):
  --skill NAME    Install specific skill (can be used multiple times)
  --all-skills    Install all available skills (default when piping)

Interactive Mode:
  If no flags are provided, an interactive prompt will guide you.
EOF
}

# Helper to add to .gitignore if not present
update_gitignore() {
  local entry="$1"
  if [[ -f ".gitignore" ]]; then
    if grep -qF "$entry" .gitignore; then
      return
    fi
    echo "" >> .gitignore
    echo "# Added by ${PROJECT_NAME} installer" >> .gitignore
    echo "$entry" >> .gitignore
    echo "Added '$entry' to .gitignore"
  fi
}

# Check if we're in an interactive environment
# Returns true if stdin is a terminal (user can provide input)
is_interactive() {
  [[ -t 0 ]]
}

main() {
  local install_type="interactive" # Default to interactive if no flags
  local self_install=false
  local target_platforms=() # Default empty, interactive will set it or agents default
  local target_skills=()
  local explicit_flags=false # Track if user provided explicit flags

  # 1. Parse Arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -g|--global) install_type="global"; explicit_flags=true; shift ;;
      -l|--local) install_type="local"; explicit_flags=true; shift ;;
      -s|--self) self_install=true; explicit_flags=true; shift ;;
      -h|--help) usage; exit 0 ;;
      --opencode) target_platforms+=("OpenCode"); explicit_flags=true; shift ;;
      --gemini) target_platforms+=("Gemini CLI"); explicit_flags=true; shift ;;
      --claude) target_platforms+=("Claude"); explicit_flags=true; shift ;;
      --droid) target_platforms+=("FactoryAI Droid"); explicit_flags=true; shift ;;
      --factory) target_platforms+=("FactoryAI Droid"); explicit_flags=true; shift ;;
      --agents) target_platforms+=("Agents"); explicit_flags=true; shift ;;
      --antigravity) target_platforms+=("Antigravity"); explicit_flags=true; shift ;;
      --skill) 
        if [[ -n "${2:-}" ]]; then
          target_skills+=("$2")
          explicit_flags=true
          shift 2
        else
          echo "Error: --skill requires a skill name"
          exit 1
        fi
        ;;
      --all-skills) 
        # Mark to install all skills - will be populated after detecting available skills
        target_skills=("__ALL__")
        explicit_flags=true
        shift
        ;;
      *) echo "Unknown option: $1"; usage; exit 1 ;;
    esac
  done

  # Detect Source
  local src_dir
  if [[ "$self_install" == true ]]; then
    if [[ -z "${BASH_SOURCE[0]:-}" ]]; then
      echo "Error: --self flag requires running the script directly, not via pipe"
      echo "Usage: ./install.sh --self"
      exit 1
    fi
    src_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  elif [[ -n "${BASH_SOURCE[0]:-}" ]] && [[ -d "$(dirname "${BASH_SOURCE[0]}")/skills" ]]; then
    # Script is being run directly from a cloned repo (not piped)
    # Check if there's a skills directory next to the script
    src_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    echo "Detected local repository at: $src_dir"
    echo "Using --self mode automatically"
  else
    src_dir=$(mktemp -d)
    trap "rm -rf '$src_dir'" EXIT
    git clone --depth 1 --quiet "$REPO_URL" "$src_dir"
  fi

  # 2. Interactive Logic
  # If no explicit flags provided and we're not interactive, show error
  if [[ "$explicit_flags" == false ]] && ! is_interactive; then
    echo "Error: Interactive mode requires a terminal."
    echo "When piping the script without explicit flags, you must specify platforms and installation type."
    echo ""
    echo "Examples:"
    echo "  curl ... | bash -s -- --global --opencode"
    echo "  curl ... | bash -s -- --local --opencode --gemini"
    echo "  curl ... | bash -s -- --global --opencode --skill chrome-extension-architect"
    echo ""
    echo "Available platforms: --opencode, --gemini, --claude, --droid, --agents, --antigravity"
    echo "Available skills: aquaria-cloudflare-ops, arg-parser, chrome-extension-architect, git-commit-writer, large-file-refactorer, skill-forge"
    echo ""
    echo "Use --skill NAME to install specific skills (can be used multiple times)"
    echo "Use --all-skills to install all available skills"
    exit 1
  fi
  
  # If no install type or platforms specified, we need to go interactive
  if [[ "$install_type" == "interactive" ]] || [[ ${#target_platforms[@]} -eq 0 ]]; then
    install_type="global" # Reset default for interactive flow

    # A. Select Scope
    echo ""
    PS3="Select installation scope: "
    select scope_choice in "Install Globally (userspace ~/)" "Install locally (project ./)"; do
      case "$REPLY" in
        1) install_type="global"; break ;;
        2) install_type="local"; break ;;
        *) echo "Invalid selection." ;;
      esac
    done

    # B. Select Agents
    echo ""
    echo "Select agents (toggle with number, comma/space separated, choose Done when finished):"
    local choice=""
    local agent_input=""
    while true; do
      local selection_count=0
      if declare -p target_platforms >/dev/null 2>&1; then
        selection_count=${#target_platforms[@]}
      fi
      if [[ "$selection_count" -gt 0 ]]; then
        local joined=""
        for p in "${target_platforms[@]}"; do
          if [[ -n "$joined" ]]; then
            joined="${joined}, ${p}"
          else
            joined="$p"
          fi
        done
        echo "Current selection: ${joined}"
      else
        echo "Current selection: (none)"
      fi

      local select_all_label="Select All"
      if [[ "$selection_count" -gt 0 ]]; then
        select_all_label="Deselect All"
      fi
      echo "1) OpenCode  2) Gemini CLI  3) Claude  4) FactoryAI Droid"
      echo "5) Agents    6) Antigravity 7) ${select_all_label}  8) Done"
      read -r -p "Agent(s): " agent_input || break
      agent_input="${agent_input//,/ }"

      if [[ -z "$agent_input" ]]; then
        echo "Invalid selection."
        echo ""
        continue
      fi

      if [[ "$agent_input" == "done" || "$agent_input" == "8" ]]; then
        break
      fi

      if [[ "$agent_input" == "all" || "$agent_input" == "7" ]]; then
        local has_selection=0
        if declare -p target_platforms >/dev/null 2>&1; then
          has_selection=${#target_platforms[@]}
        fi
        if [[ "$has_selection" -gt 0 ]]; then
          target_platforms=()
          echo "Deselected: All"
        else
          target_platforms=("OpenCode" "Gemini CLI" "Claude" "FactoryAI Droid" "Agents" "Antigravity")
          echo "Selected: All"
        fi
        echo ""
        continue
      fi

      if [[ "$agent_input" =~ ^[0-9]+$ ]]; then
        local digits=()
        local i
        for ((i=0; i<${#agent_input}; i++)); do
          digits+=("${agent_input:$i:1}")
        done
        agent_input="${digits[*]}"
      fi

      for idx in $agent_input; do
        case "$idx" in
          1) choice="OpenCode" ;;
          2) choice="Gemini CLI" ;;
          3) choice="Claude" ;;
          4) choice="FactoryAI Droid" ;;
          5) choice="Agents" ;;
          6) choice="Antigravity" ;;
          7) choice="__all__" ;;
          8) choice="__done__" ;;
          *) choice="__invalid__" ;;
        esac

        case "$choice" in
          "__all__")
            local has_selection=0
            if declare -p target_platforms >/dev/null 2>&1; then
              has_selection=${#target_platforms[@]}
            fi
            if [[ "$has_selection" -gt 0 ]]; then
              target_platforms=()
              echo "Deselected: All"
            else
              target_platforms=("OpenCode" "Gemini CLI" "Claude" "FactoryAI Droid" "Agents" "Antigravity")
              echo "Selected: All"
            fi
            ;;
          "__done__")
            break 2
            ;;
          "__invalid__")
            echo "Invalid selection: $idx"
            ;;
          *)
            if [[ " ${target_platforms[*]-} " =~ " ${choice} " ]]; then
              local updated=()
              for p in "${target_platforms[@]}"; do
                [[ "$p" == "$choice" ]] && continue
                updated+=("$p")
              done
              if [[ ${#updated[@]} -eq 0 ]]; then
                unset target_platforms
              else
                target_platforms=("${updated[@]}")
              fi
              echo "Deselected: $choice"
            else
              target_platforms+=("$choice")
              echo "Selected: $choice"
            fi
            ;;
        esac
      done
      echo ""
    done

    # Fallback if empty
    local final_count=0
    if declare -p target_platforms >/dev/null 2>&1; then
      final_count=${#target_platforms[@]}
    fi
    if [[ "$final_count" -eq 0 ]]; then
      target_platforms=("Agents")
      echo "No agents selected, defaulting to Agents."
    fi
  fi

  # C. Select Skills
  # Detect skills in src_dir/skills/
  available_skills=()
  if [[ -d "${src_dir}/skills" ]]; then
    for skill_dir in "${src_dir}/skills"/*; do
      [[ -d "$skill_dir" ]] || continue
      available_skills+=("$(basename "$skill_dir")")
    done
  fi

  # Handle --all-skills flag (expand to all available skills)
  if [[ ${#target_skills[@]} -gt 0 ]]; then
    local has_all_flag=false
    local new_target_skills=()
    for skill in "${target_skills[@]}"; do
      if [[ "$skill" == "__ALL__" ]]; then
        has_all_flag=true
      else
        new_target_skills+=("$skill")
      fi
    done
    if [[ "$has_all_flag" == true ]]; then
      target_skills=("${available_skills[@]}")
    else
      target_skills=("${new_target_skills[@]}")
    fi
  fi

  # If skills were specified via --skill flags, validate them
  if [[ ${#target_skills[@]} -gt 0 ]]; then
    local validated_skills=()
    for skill in "${target_skills[@]}"; do
      local found=false
      for available in "${available_skills[@]}"; do
        if [[ "$skill" == "$available" ]]; then
          found=true
          validated_skills+=("$skill")
          break
        fi
      done
      if [[ "$found" == false ]]; then
        echo "Warning: Skill '$skill' not found, skipping"
      fi
    done
    target_skills=("${validated_skills[@]}")
  fi

  # Interactive skill selection (only if we have a terminal)
  if [[ ${#available_skills[@]} -gt 0 ]] && is_interactive && [[ ${#target_skills[@]} -eq 0 ]]; then
    echo ""
    echo "Select skills (toggle with number, comma/space separated, choose Done when finished):"

    while true; do
      local selection_count=${#target_skills[@]}

      # Display Current Selection
      if [[ "$selection_count" -gt 0 ]]; then
        local joined=""
        for s in "${target_skills[@]}"; do
          if [[ -n "$joined" ]]; then
            joined="${joined}, ${s}"
          else
            joined="$s"
          fi
        done
        echo "Current selection: ${joined}"
      else
        echo "Current selection: (none)"
      fi

      # Options
      local total_skills=${#available_skills[@]}
      local idx_all=$((total_skills + 1))
      local idx_done=$((total_skills + 2))

      local i=0
      for skill in "${available_skills[@]}"; do
        i=$((i+1))
        echo "${i}) ${skill}"
      done

      local select_all_label="Select All"
      if [[ "$selection_count" -gt 0 ]]; then
        select_all_label="Deselect All"
      fi

      echo "${idx_all}) ${select_all_label}"
      echo "${idx_done}) Done"

      read -r -p "Skill(s): " skill_input || break
      skill_input="${skill_input//,/ }"

      if [[ -z "$skill_input" ]]; then
        echo "Invalid selection."
        echo ""
        continue
      fi

      if [[ "$skill_input" == "done" || "$skill_input" == "$idx_done" ]]; then
        break
      fi

      if [[ "$skill_input" == "all" || "$skill_input" == "$idx_all" ]]; then
        if [[ "$selection_count" -gt 0 ]]; then
          target_skills=()
          echo "Deselected: All"
        else
          target_skills=("${available_skills[@]}")
          echo "Selected: All"
        fi
        echo ""
        continue
      fi

      # Parse numbers
      for token in $skill_input; do
        if [[ "$token" =~ ^[0-9]+$ ]]; then
          if [[ "$token" -ge 1 && "$token" -le "$total_skills" ]]; then
            local selected="${available_skills[$((token-1))]}"

            # Toggle
            if [[ " ${target_skills[*]-} " =~ " ${selected} " ]]; then
              # Remove
              local new_list=()
              for s in "${target_skills[@]}"; do
                [[ "$s" == "$selected" ]] && continue
                new_list+=("$s")
              done
              target_skills=("${new_list[@]}")
              echo "Deselected: $selected"
            else
              # Add
              target_skills+=("$selected")
              echo "Selected: $selected"
            fi
          elif [[ "$token" -eq "$idx_all" ]]; then
             # Handle All by number
             if [[ "$selection_count" -gt 0 ]]; then
                target_skills=()
                echo "Deselected: All"
             else
                target_skills=("${available_skills[@]}")
                echo "Selected: All"
             fi
          elif [[ "$token" -eq "$idx_done" ]]; then
             break 2
          else
             echo "Invalid number: $token"
          fi
        fi
      done
      echo ""
    done
  fi

  # If no skills found or selected, default to all
  if [[ ${#target_skills[@]} -eq 0 ]] && [[ -d "${src_dir}/skills" ]]; then
     echo "No skills selected, defaulting to ALL."
     target_skills=("${available_skills[@]}")
  fi

  # D. Gitignore (Local only)
  if [[ "$install_type" == "local" ]]; then
    read -p "Add local agent folders to .gitignore? (y/n): " gitignore_choice || true
    if [[ "$gitignore_choice" =~ ^[Yy]$ ]]; then
      for p in "${target_platforms[@]}"; do
        local p_dir
        case "$p" in
          "OpenCode") p_dir=".opencode" ;;
          "Gemini CLI") p_dir=".gemini" ;;
          "Claude") p_dir=".claude" ;;
          "FactoryAI Droid") p_dir=".factory" ;;
          "Agents") p_dir=".agents" ;;
          "Antigravity") p_dir=".antigravity" ;;
          *) continue ;;
        esac
        update_gitignore "$p_dir/"
      done
    fi
  fi

  echo ""
  echo "Installing ${PROJECT_NAME} to ${install_type} targets..."

  # 3. Installation Helper
  install_skill_to() {
    local platform="$1"
    local skill_name="$2"
    local base_dir="$3"
    local command_dir="${4:-}"

    local target_skill_dir="${base_dir}/${skill_name}"
    local p_norm=$(normalize_platform "$platform")

    # Safety checks...
    if [[ -z "$skill_name" ]] || [[ "$target_skill_dir" == "/" ]] || [[ "$target_skill_dir" == "$HOME" ]]; then
      return 1
    fi

    # Explicit copy strategy:
    # 1. Create base dir
    # 2. Remove old target dir
    # 3. Re-create target dir
    # 4. Copy contents INTO target dir using /. syntax for robustness
    mkdir -p "$base_dir"
    rm -rf "$target_skill_dir"
    mkdir -p "$target_skill_dir"
    cp -r "${src_dir}/skills/${skill_name}/." "$target_skill_dir/"

    # Standardize SKILL.md
    if [[ -f "${target_skill_dir}/Skill.md" ]]; then
      mv "${target_skill_dir}/Skill.md" "${target_skill_dir}/SKILL.md"
    fi
    echo "  - Installed skill: ${skill_name} to ${platform}"

    # Install command if needed
    if [[ -n "$command_dir" ]]; then
      local cmd_src=""
      local cmd_ext=""

      if [[ "$p_norm" == "opencode" ]]; then
        cmd_src="${src_dir}/commands/opencode/${skill_name}.md"
        cmd_ext=".md"
        # Fallback for backward compatibility
        if [[ ! -f "$cmd_src" ]]; then
            cmd_src="${src_dir}/commands/${skill_name}.md"
        fi
      elif [[ "$p_norm" == "gemini" ]]; then
        cmd_src="${src_dir}/commands/gemini/${skill_name}.toml"
        cmd_ext=".toml"
      elif [[ "$p_norm" == "droid" ]]; then
        cmd_src="${src_dir}/commands/droid/${skill_name}.md"
        cmd_ext=".md"
      fi

      if [[ -n "$cmd_src" && -f "$cmd_src" ]]; then
        mkdir -p "$command_dir"
        local target_cmd="${command_dir}/${skill_name}${cmd_ext}"

        cp "$cmd_src" "$target_cmd"

        # Post-process for Gemini and Droid
        if [[ "$p_norm" == "gemini" || "$p_norm" == "droid" ]]; then
           # Use | as delimiter for sed
           sed "s|{{SKILL_PATH}}|${target_skill_dir}|g" "$target_cmd" > "$target_cmd.tmp" && mv "$target_cmd.tmp" "$target_cmd"
        fi

        echo "  - Installed command: ${skill_name} to ${platform}"
      fi
    fi
  }

  # 4. Execute
  for platform in "${target_platforms[@]}"; do
    local s_base=""
    local c_base=""

    if [[ "$install_type" == "global" ]]; then
      case "$platform" in
        "OpenCode") s_base="$HOME/.config/opencode/skills"; c_base="$HOME/.config/opencode/commands" ;;
        "Gemini CLI") s_base="$HOME/.gemini/skills"; c_base="$HOME/.gemini/commands" ;;
        "Claude") s_base="$HOME/.claude/skills" ;;
        "FactoryAI Droid") s_base="$HOME/.factory/skills"; c_base="$HOME/.factory/commands" ;;
        "Agents") s_base="$HOME/.config/agents/skills" ;;
        "Antigravity") s_base="$HOME/.antigravity/skills" ;;
      esac
    else
      case "$platform" in
        "OpenCode") s_base=".opencode/skills"; c_base=".opencode/commands" ;;
        "Gemini CLI") s_base=".gemini/skills"; c_base=".gemini/commands" ;;
        "Claude") s_base=".claude/skills" ;;
        "FactoryAI Droid") s_base=".factory/skills"; c_base=".factory/commands" ;;
        "Agents") s_base=".agents/skills" ;;
        "Antigravity") s_base=".antigravity/skills" ;;
      esac
    fi

    if [[ -n "$s_base" ]]; then
      if [[ ${#target_skills[@]} -gt 0 ]]; then
        for skill in "${target_skills[@]}"; do
          install_skill_to "$platform" "$skill" "$s_base" "$c_base"
        done
      fi
    fi
  done

  echo "Done."
}

main "$@"
