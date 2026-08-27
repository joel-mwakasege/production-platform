export type Phase = 'Idea' | 'Script' | 'Breakdown' | 'Plan' | 'Schedule' | 'Production'

type PhaseRailProps = {
  activePhase: Phase
  onPhaseChange: (phase: Phase) => void
}

const phases: Phase[] = ['Idea', 'Script', 'Breakdown', 'Plan', 'Schedule', 'Production']

export function PhaseRail({ activePhase, onPhaseChange }: PhaseRailProps) {
  const activeIndex = phases.indexOf(activePhase)

  return <div className="full-phase-rail" aria-label="Production stages">{phases.map((phase, index) => <button className={phase === activePhase ? 'active' : index < activeIndex ? 'done' : ''} key={phase} type="button" onClick={() => onPhaseChange(phase)}><span>{index + 1}</span>{phase}</button>)}</div>
}
