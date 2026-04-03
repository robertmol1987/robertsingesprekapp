"use client";
import React, { useState, useEffect } from "react";

function MainComponent() {
  const [cards, setCards] = useState([]);
  const [usedCards, setUsedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardSet, setCardSet] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get("id");

        if (!id) {
          setError("Geen kaart ID gevonden in de URL");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/conversation-cards/get", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch cards");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setCardSet(data.card);
        setCards(data.card.cards);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Er ging iets mis bij het ophalen van de kaarten");
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  const shuffleCards = () => {
    setCards([...usedCards]);
    setUsedCards([]);
    setSelectedCard(null);
  };

  const selectRandomCard = () => {
    if (cards.length === 0) return;

    const randomIndex = Math.floor(Math.random() * cards.length);
    const randomCard = cards[randomIndex];

    const newCards = [...cards];
    newCards.splice(randomIndex, 1);
    setCards(newCards);
    setUsedCards((prev) => [...prev, randomCard]);

    setSelectedCard(randomCard);
  };

  const totalCards = cards.length + usedCards.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#143f31] p-4 flex items-center justify-center">
        <div className="text-white text-xl">Kaarten worden geladen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#143f31] p-4 flex items-center justify-center">
        <div className="bg-[#1d4c3e] rounded-xl p-6 max-w-lg w-full text-center">
          <div className="text-white mb-4">{error}</div>
          <a
            href="/"
            className="text-[#e0d4bc] hover:text-[#decaa2] transition-colors"
          >
            Terug naar de hoofdpagina
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#143f31] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#1d4c3e] rounded-xl p-6 mb-8 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-4 font-crimson-text">
            {cardSet.topic}
          </h1>
        </div>

        {(cards.length > 0 || usedCards.length > 0) && (
          <div className="space-y-8">
            <div className="bg-[#1d4c3e] rounded-lg p-4 text-center">
              <div className="grid grid-cols-3 gap-4 text-white">
                <div>
                  <div className="font-semibold">Totaal</div>
                  <div className="text-2xl">{totalCards}</div>
                </div>
                <div>
                  <div className="font-semibold">Getrokken</div>
                  <div className="text-2xl">{usedCards.length}</div>
                </div>
                <div>
                  <div className="font-semibold">Resterend</div>
                  <div className="text-2xl">{cards.length}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1d4c3e] rounded-lg p-6 text-center">
                {cards.length > 0 ? (
                  <button
                    onClick={selectRandomCard}
                    className="w-full h-48 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold text-lg transition-colors"
                  >
                    Trek een nieuwe kaart
                  </button>
                ) : (
                  <button
                    onClick={shuffleCards}
                    className="w-full h-48 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold text-lg transition-colors"
                  >
                    Schud de kaarten opnieuw
                  </button>
                )}
              </div>
              <div className="bg-[#1d4c3e] rounded-lg p-6">
                <h3 className="text-[#e0d4bc] font-semibold mb-4 text-center">
                  Wat vind jij?
                </h3>
                {selectedCard ? (
                  <div className="h-48 flex items-center justify-center text-center p-4 border-2 border-white bg-white rounded-lg">
                    <p className="text-base text-black overflow-y-auto max-h-full px-2">
                      <strong className="underline">Vraag of stelling:</strong>
                      <br />
                      {selectedCard.question}
                    </p>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-center p-4 border-2 border-[#e0d4bc] rounded-lg text-[#decaa2]">
                    Trek een kaart om te beginnen
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;