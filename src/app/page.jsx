"use client";
import React from "react";

function MainComponent() {
  const MAX_CARDS = 30;
  const WARNING_DURATION = 10;
  const warningText =
    "Let op: De inhoud van deze gesprekskaarten wordt gegenereerd door kunstmatige intelligentie. Het weerspiegelt absoluut niet de gedachten van de maker van deze app. Er kunnen ook fouten en feitelijke onjuistheden worden gegenereerd.";
  const [showGeneratedWarning, setShowGeneratedWarning] = useState(false);
  const [warningTimeLeft, setWarningTimeLeft] = useState(WARNING_DURATION);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCards, setCustomCards] = useState("");
  const [formData, setFormData] = useState({
    topic: "",
    targetAudience: "",
    language: "",
    specialNotes: "",
    cardCount: "15",
    contentType: "statements",
  });
  const [cards, setCards] = useState([]);
  const [usedCards, setUsedCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [error, setError] = useState(null);
  const [savedCardId, setSavedCardId] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [generatedCards, setGeneratedCards] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    document.title = "De 'In gesprek!' app";
  }, []);

  useEffect(() => {
    let timer;
    if (showGeneratedWarning) {
      setWarningTimeLeft(WARNING_DURATION);
      timer = setInterval(() => {
        setWarningTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowGeneratedWarning(false);
            return WARNING_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showGeneratedWarning]);

  const generateCards = async () => {
    setShowGeneratedWarning(true);
    setLoading(true);
    setError(null);
    setSavedCardId(null);
    setQrCode(null);
    setGeneratedCards(null);
    setIsReviewing(false);
    try {
      const requestedCards = Math.min(
        parseInt(formData.cardCount) || 15,
        MAX_CARDS
      );

      const response = await fetch("/api/generate-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          numberOfQuestions: requestedCards,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cards");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedCards({
        topic: formData.topic,
        targetAudience: formData.targetAudience,
        specialNotes: formData.specialNotes,
        cards: data.cards,
      });
      setIsReviewing(true);
    } catch (err) {
      setError(
        "Er ging iets mis bij het genereren van de kaarten. Probeer het opnieuw."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeCard = (indexToRemove) => {
    setGeneratedCards((prev) => ({
      ...prev,
      cards: prev.cards.filter((_, index) => index !== indexToRemove),
    }));
  };

  const saveAndPublishCards = async () => {
    try {
      setLoading(true);
      const saveResponse = await fetch("/api/conversation-cards/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generatedCards),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save cards");
      }

      const savedData = await saveResponse.json();
      if (savedData.error) {
        throw new Error(savedData.error);
      }

      setSavedCardId(savedData.card.id);

      const viewUrl = `${window.location.origin}/view-cards?id=${savedData.card.id}`;
      const qrResponse = await fetch("/api/qr-code-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: viewUrl }),
      });

      if (!qrResponse.ok) {
        throw new Error("Failed to generate QR code");
      }

      const qrData = await qrResponse.json();
      setQrCode(qrData.body);

      setCards(generatedCards.cards || []);
      setUsedCards([]);
      setSelectedCard(null);
      setIsReviewing(false);
      setGeneratedCards(null);
    } catch (err) {
      setError(
        "Er ging iets mis bij het opslaan van de kaarten. Probeer het opnieuw."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
  const demoData = {
    topic: "Effectief studeren",
    targetAudience: "Studenten MBO",
    language: "Nederlands",
    specialNotes: "Betrek de thuissituatie er expliciet bij",
    cardCount: "15",
    contentType: "statements",
  };

  const fillDemoData = () => {
    setFormData(demoData);
  };

  const clearForm = () => {
    setFormData({
      topic: "",
      targetAudience: "",
      language: "",
      specialNotes: "",
      cardCount: "15",
      contentType: "statements",
    });
  };

  const saveCustomCards = async () => {
    const lines = customCards
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      setError("Voer minimaal één stelling of vraag in.");
      return;
    }

    const cardsData = {
      topic: "Eigen stellingen/vragen",
      targetAudience: "",
      specialNotes: "",
      cards: lines.map((line) => ({ question: line })),
    };

    try {
      setLoading(true);
      const saveResponse = await fetch("/api/conversation-cards/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardsData),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save cards");
      }

      const savedData = await saveResponse.json();
      if (savedData.error) {
        throw new Error(savedData.error);
      }

      setSavedCardId(savedData.card.id);

      const viewUrl = `${window.location.origin}/view-cards?id=${savedData.card.id}`;
      const qrResponse = await fetch("/api/qr-code-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: viewUrl }),
      });

      if (!qrResponse.ok) {
        throw new Error("Failed to generate QR code");
      }

      const qrData = await qrResponse.json();
      setQrCode(qrData.body);

      setCards(cardsData.cards);
      setUsedCards([]);
      setSelectedCard(null);
      setShowCustomInput(false);
      setCustomCards("");
    } catch (err) {
      setError(
        "Er ging iets mis bij het opslaan van de kaarten. Probeer het opnieuw."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditingText(generatedCards.cards[index].question);
  };

  const saveEdit = (index) => {
    setGeneratedCards((prev) => ({
      ...prev,
      cards: prev.cards.map((card, i) =>
        i === index ? { ...card, question: editingText } : card
      ),
    }));
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  return (
    <div className="min-h-screen bg-[#143f31] p-4">
      <div className="max-w-2xl mx-auto relative">
        <div className="absolute -top-2 right-0 flex items-center gap-4">
          <a
            href="https://robertsdigitaledidactiek.created.app/"
            className="text-white text-2xl hover:text-gray-200 transition-colors"
          >
            🛠️
          </a>
          <a
            href="https://www.digitaledidactiek.com"
            className="text-white text-2xl font-bold hover:text-gray-200 transition-colors"
          >
            ✕
          </a>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-crimson-text text-left">
          De 'In gesprek!' app
        </h1>
        <div className="text-white mb-6 text-left">
          <p className="mb-2">
            door Robert Mol,{" "}
            <a
              href="https://www.digitaledidactiek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e0d4bc] hover:text-[#decaa2]"
            >
              www.digitaledidactiek.com
            </a>
          </p>
        </div>
        {showGeneratedWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full relative border-4 border-black">
              <p className="text-black text-center text-lg">
                🤖 De gesprekskaarten worden nu gegenereerd. Even geduld
                alsjeblieft.
                <br />
                <br />
                ⚠️ {warningText}
              </p>
              <div className="mt-4 text-black text-center font-bold">
                ⏳ Deze melding verdwijnt over {warningTimeLeft}{" "}
                {warningTimeLeft === 1 ? "seconde." : "seconden."}
              </div>
            </div>
          </div>
        )}

        {!showCustomInput && cards.length === 0 && usedCards.length === 0 && (
          <div className="bg-[#1d4c3e] rounded-xl p-6 mb-8 shadow-lg space-y-4 relative">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white">
                ✨ Gesprekskaarten genereren
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={clearForm}
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg transition-colors"
                >
                  Maak leeg
                </button>
                <button
                  onClick={fillDemoData}
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg transition-colors"
                >
                  Demo
                </button>
                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg transition-colors"
                >
                  Eigen stellingen/vragen invoeren
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowDisclaimer(true)}
              className="w-full p-2 bg-white hover:bg-gray-100 text-black rounded mb-4 transition-colors"
            >
              Lees de disclaimer over datagebruik en ethiek.
            </button>
            {showDisclaimer && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-[#1d4c3e] rounded-xl p-6 max-w-lg w-full relative">
                  <button
                    onClick={() => setShowDisclaimer(false)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-white"
                  >
                    ✕
                  </button>
                  <h2 className="text-xl font-bold mb-4 text-white">
                    Disclaimer
                  </h2>
                  <div className="space-y-4">
                    <div className="p-2 bg-[#ff0000] text-white text-sm rounded">
                      Let op: De inhoud van deze gesprekskaarten wordt
                      gegenereerd door kunstmatige intelligentie. Het
                      weerspiegelt absoluut niet de gedachten van de maker van
                      deze app.
                      <br />
                      <br />
                      AI kan feitelijke onjuistheden genereren. Alle data die je
                      instuurt wordt opgeslagen bij Google. Pas dus op met
                      persoonsgegevens en andere gevoelige informatie.
                    </div>
                    <div className="p-2 bg-[#e0d4bc] text-black text-sm rounded">
                      Overweeg kritisch of je gesprekskaarten wilt laten
                      genereren over écht gevoelige, polariserende of zware
                      onderwerpen. Misschien is menselijke nuance en
                      terughoudendheid hierin wijzer, behalve als je heel goed
                      weet hoe je dit soort gesprekken kunt begeleiden of
                      voeren.
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-4">
              <div className="mt-2 p-2 bg-[#e0d4bc] text-[#143f31] text-sm rounded">
                Wat voor gesprekskaarten kan ik laten genereren?
                <br />
                Gesprekskaarten met
                <br />- Kennismakingsvragen
                <br />- Vragen over specifieke leerstof
                <br />- Vragen over games, hobby's, films of series
                <br />- Stellingen waarover je kunt debatteren
              </div>
            </div>

            <label className="block text-white text-lg mb-2 font-inter font-bold">
              Onderwerp
              <div className="text-sm text-[#decaa2] font-normal">
                (Het hoofdonderwerp waar de kaarten over moeten gaan)
              </div>
            </label>
            <textarea
              className="w-full p-3 border-2 border-[#e0d4bc] rounded-lg focus:outline-none focus:border-[#decaa2] bg-[#143f31] text-white min-h-[80px] resize-y"
              value={formData.topic}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, topic: e.target.value }))
              }
              placeholder="Bijvoorbeeld: Effectief studeren"
            />

            <label className="block text-white text-lg mb-2 font-inter font-bold">
              Doelgroep
              <div className="text-sm text-[#decaa2] font-normal">
                (Optioneel: Voor wie zijn deze kaarten bedoeld?)
              </div>
            </label>
            <input
              type="text"
              className="w-full p-3 border-2 border-[#e0d4bc] rounded-lg focus:outline-none focus:border-[#decaa2] bg-[#143f31] text-white"
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  targetAudience: e.target.value,
                }))
              }
              placeholder="Bijvoorbeeld: Studenten MBO"
            />

            <label className="block text-white text-lg mb-2 font-inter font-bold">
              Taal
              <div className="text-sm text-[#decaa2] font-normal">
                (Optioneel: In welke taal moeten de kaarten zijn?)
              </div>
            </label>
            <input
              type="text"
              className="w-full p-3 border-2 border-[#e0d4bc] rounded-lg focus:outline-none focus:border-[#decaa2] bg-[#143f31] text-white"
              value={formData.language}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, language: e.target.value }))
              }
              placeholder="Bijvoorbeeld: Nederlands"
            />

            <label className="block text-white text-lg mb-2 font-inter font-bold">
              Bijzonderheden
              <div className="text-sm text-[#decaa2] font-normal">
                (Optioneel: Specifieke wensen of aandachtspunten)
              </div>
            </label>
            <textarea
              className="w-full p-3 border-2 border-[#e0d4bc] rounded-lg focus:outline-none focus:border-[#decaa2] bg-[#143f31] text-white min-h-[80px] resize-y"
              value={formData.specialNotes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  specialNotes: e.target.value,
                }))
              }
              placeholder="Bijvoorbeeld: Betrek de thuissituatie er expliciet bij"
            />

            <label className="block text-white text-lg mb-2 font-inter font-bold">
              Aantal kaarten
              <div className="text-sm text-[#decaa2] font-normal">
                (Hoeveel kaarten wil je genereren? Max {MAX_CARDS})
              </div>
            </label>
            <input
              type="number"
              min="1"
              max={MAX_CARDS}
              className="w-full p-3 border-2 border-[#e0d4bc] rounded-lg focus:outline-none focus:border-[#decaa2] bg-[#143f31] text-white"
              value={formData.cardCount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  cardCount: e.target.value,
                }))
              }
            />

            <label className="block text-white text-lg mb-2 font-inter font-bold">
              Type inhoud
              <div className="text-sm text-[#decaa2] font-normal">
                (Wil je stellingen of vragen?)
              </div>
            </label>
            <select
              className="w-full p-3 border-2 border-[#e0d4bc] rounded-lg focus:outline-none focus:border-[#decaa2] bg-[#143f31] text-white"
              value={formData.contentType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contentType: e.target.value,
                }))
              }
            >
              <option value="statements">Stellingen</option>
              <option value="questions">Vragen</option>
            </select>

            <button
              onClick={generateCards}
              disabled={loading || !formData.topic.trim()}
              className="w-full px-8 py-3 bg-white hover:bg-gray-100 text-black rounded-lg font-inter transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Bezig met genereren..." : "Genereer kaarten"}
            </button>

            {error && <p className="mt-4 text-red-500">{error}</p>}
          </div>
        )}

        {showCustomInput && (
          <div className="bg-[#1d4c3e] rounded-xl p-6 mb-8 shadow-lg space-y-4 relative">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white">
                ✨ Eigen stellingen/vragen invoeren
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-white text-lg mb-2 font-inter font-bold">
                  Eigen stellingen/vragen
                </h3>
                <p className="text-[#decaa2] mb-4">
                  Voer hier je stellingen/vragen in.
                </p>
                <textarea
                  className="w-full p-3 border-2 border-[#e0d4bc] rounded-lg focus:outline-none focus:border-[#decaa2] bg-[#143f31] text-white min-h-[300px] resize-y"
                  value={customCards}
                  onChange={(e) => setCustomCards(e.target.value)}
                  placeholder="Voer elke stelling of vraag in op een nieuwe regel..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomCards("");
                  }}
                  className="px-8 py-3 bg-white hover:bg-gray-100 text-black rounded-lg font-inter transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={saveCustomCards}
                  disabled={loading || customCards.trim().length === 0}
                  className="px-8 py-3 bg-white hover:bg-gray-100 text-black rounded-lg font-inter transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Bezig met opslaan..." : "Opslaan en publiceren"}
                </button>
              </div>
              {error && <p className="mt-4 text-red-500">{error}</p>}
            </div>
          </div>
        )}

        {(cards.length > 0 || usedCards.length > 0) && (
          <div className="space-y-8">
            {savedCardId && qrCode && (
              <div className="bg-[#1d4c3e] rounded-lg p-6 text-center">
                <h3 className="text-xl font-bold text-[#e0d4bc] mb-4">
                  Deel je kaarten:
                </h3>
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                  <p className="text-[#decaa2]">
                    Scan de QR code of gebruik deze link:
                  </p>
                  <a
                    href={`/view-cards?id=${savedCardId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#e0d4bc] hover:text-[#decaa2] transition-colors"
                  >
                    Open kaarten in nieuwe tab
                  </a>
                </div>
              </div>
            )}

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

        {isReviewing && generatedCards ? (
          <div className="bg-[#1d4c3e] rounded-xl p-6 mb-8 shadow-lg space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Controleer de kaarten
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsReviewing(false);
                    setGeneratedCards(null);
                  }}
                  className="px-4 py-2 bg-white text-[#143f31] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={saveAndPublishCards}
                  className="px-4 py-2 bg-white text-[#143f31] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Publiceren
                </button>
              </div>
            </div>

            <p className="text-[#e0d4bc] text-lg mb-6">
              Controleer of onderstaande kaarten passend zijn. Verwijder gerust
              kaarten die niet passend zijn. Klik daarna op 'Publiceren' om de
              kaarten te kunnen bekijken en te delen.
            </p>

            <div>
              <h3 className="font-semibold text-white mb-4">
                Kaarten ({generatedCards.cards.length}):
              </h3>
              <div className="space-y-2">
                {generatedCards.cards.map((card, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[#e0d4bc] rounded-lg hover:bg-[#decaa2] transition-colors"
                  >
                    {editingIndex === index ? (
                      <div className="flex-1 mr-4 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 p-2 border-2 border-[#143f31] rounded-lg focus:outline-none bg-white text-[#143f31]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(index);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <button
                          onClick={() => saveEdit(index)}
                          className="text-green-700 hover:text-green-900 transition-colors"
                          title="Opslaan"
                        >
                          ✅
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                          title="Annuleren"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-[#143f31] flex-1 mr-4">
                          {card.question}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditing(index)}
                            className="text-[#143f31] hover:text-black transition-colors"
                            title="Bewerk deze kaart"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => removeCard(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Verwijder deze kaart"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default MainComponent;