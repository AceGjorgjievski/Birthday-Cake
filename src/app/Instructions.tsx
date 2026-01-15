'use client'

interface InstructionsProps {
  candlesBlown: boolean;
  audioFinished: boolean;
}

export default function Instructions({ candlesBlown, audioFinished }: InstructionsProps) {
  if (candlesBlown) {
    return (
      <div className="instructions celebration">
        <h2>🎉 Congratulations! 🎉</h2>
        <p>You blew out all the candles! Make a wish!</p>
      </div>
    )
  }

  if (!audioFinished) {
    return (
      <div className="instructions">
        <h3>🎵 Listen to the birthday song first!</h3>
        <p>Then you can blow out the candles</p>
      </div>
    )
  }

  return (
    <div className="instructions active">
      <h3>🎂 Blow Out the Candles!</h3>
      <p>Click and hold for 0.5 seconds to blow</p>
      <div className="hold-indicator">
        <div className="hold-circle" />
        <span>Hold to blow</span>
      </div>
    </div>
  )
}