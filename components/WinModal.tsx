"use client";

interface WinModalProps {
  winnerName: string;
  winnerColor: string;
  onPlayAgain: () => void;
}

export default function WinModal({
  winnerName,
  winnerColor,
  onPlayAgain,
}: WinModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4 animate-bounce-in">
        <div className="text-6xl">🏆</div>

        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: winnerColor }}
          />
          <h2 className="text-2xl font-bold text-gray-800">{winnerName}</h2>
        </div>

        <p className="text-gray-500 text-center">
          reached square 100 and won the game!
        </p>

        <button
          onClick={onPlayAgain}
          className="px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg transition-all active:scale-95"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
