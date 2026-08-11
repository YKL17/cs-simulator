(() => {
  if (!window.teamSystem) return;

  const originalGetTeams = teamSystem.getTeams.bind(teamSystem);
  const originalGetTeam = teamSystem.getTeam?.bind(teamSystem);
  const ACTIVE_IDS = new Set(originalGetTeams().slice(0, 32).map((t) => t.id));

  teamSystem.getTeams = () => originalGetTeams().filter((t) => ACTIVE_IDS.has(t.id)).slice(0, 32);
  if (originalGetTeam) {
    teamSystem.getTeam = (id) => {
      const team = originalGetTeam(id);
      if (!team) return null;
      return ACTIVE_IDS.has(team.id) ? team : null;
    };
  }
  teamSystem.isActiveCareerTeam = (id) => ACTIVE_IDS.has(id);
  teamSystem.getActiveTeamIds = () => Array.from(ACTIVE_IDS);

  console.info(`[team-cap-32] Active career world capped at ${ACTIVE_IDS.size} teams.`);
})();