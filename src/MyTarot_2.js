import React, { useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { motion } from "framer-motion";
import 'bootstrap/dist/css/bootstrap.min.css'
import OpenAI from "openai";
import { Button as BsButton, Form, InputGroup, Card as BsCard, Container, Row, Col, Badge } from 'react-bootstrap';

const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const tarotNames = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World",
  "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands",
  "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
  "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
  "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups",
  "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
  "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
  "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords",
  "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
  "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
  "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles",
  "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles",
  "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
];

const tarotDeck = Array.from({ length: 78 }).map((_, i) => ({
  id: `card_${i}`,
  name: tarotNames[i],
  backImage: "/images/tarot-back.png",
  frontImage: `/images/tarot-front-${i + 1}.jpg`
}));

const fetchTarotInterpretation = async (cards, question) => {
  try {
    const cardNames = cards.map(c => c.name).join(", ");
    const prompt = `다음은 사용자가 뽑은 타로 카드입니다: ${cardNames}. 이 사람의 질문은: \"${question}\". 이 카드들의 의미를 종합해서 직관적이고 영적인 타로 해석을 해 주세요. 한국어로 답해주세요.`;

    const response = await client.responses.create({
      model: "gpt-4o",
      input: prompt
    });

    console.log('API Response:', response.output_text);

    if (response && response.output_text) {
      return response.output_text;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching tarot interpretation:', error);
    return "죄송합니다. 타로 해석을 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
};

// 타로 천사가 카드 수를 결정하는 함수 추가
const determineCardCount = async (question) => {
  try {
    const prompt = `사용자가 "${question}"이라는 질문을 했습니다. 이 질문에 가장 적합한 타로 카드 수를 결정해주세요. 최소 1장, 최대 5장 사이로 결정해주세요. 숫자만 출력해주세요.`;

    const response = await client.responses.create({
      model: "gpt-4o",
      input: prompt
    });

    if (response && response.output_text) {
      // 숫자만 추출
      const cardCount = parseInt(response.output_text.match(/\d+/)?.[0] || "3");
      // 1-5 사이의 숫자로 제한
      return Math.min(Math.max(cardCount, 1), 5);
    } else {
      return 3; // 기본값
    }
  } catch (error) {
    console.error('Error determining card count:', error);
    return 3; // 오류 발생시 기본값
  }
};

export default function MyTarot() {
  const [selectedCards, setSelectedCards] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [started, setStarted] = useState(false);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const [question, setQuestion] = useState("");
  const [listening, setListening] = useState(false);
  const [gptResponse, setGptResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [maxSelectable, setMaxSelectable] = useState(3);

  const toggleCard = (card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else if (selectedCards.length < maxSelectable) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const startVoiceInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ko-KR';
    recognition.start();
    setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
  };

  const spreadCount = 3;
  const cardsPerSpread = Math.ceil(tarotDeck.length / spreadCount);
  const spreadChunks = Array.from({ length: spreadCount }, (_, i) =>
    tarotDeck.slice(i * cardsPerSpread, (i + 1) * cardsPerSpread)
  );

   // 결과를 로딩하는 동안 프로그레스 바를 움직이는 함수
   const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
      }
      setLoadingProgress(progress);
    }, 600);
    return interval;
  };

  if (!started) {
    return (
      <div className="relative flex flex-col items-center min-h-screen w-full text-center px-4 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-[-1] opacity-70"
        >
          <source src="/videos/tarot-intro.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>    
                     
          <div className="d-flex justify-content-center align-items-center">
            <span className="display-5 me-4">🔮</span>
            <BsButton 
              variant="primary"
              size="lg"
              className="py-3 px-5 shadow-lg btn-glow"
              style={{
                background: 'linear-gradient(135deg, #9333EA, #4F46E5)',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 0 20px rgba(147,51,234,0.5)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setStarted(true)}
            >
              타로 상담 시작
            </BsButton>
            <span className="display-5 ms-4">🔮</span>
          </div>
        
      </div>
    );
  }

  if (!questionSubmitted) {
    return (
      <Container className="py-5 min-vh-100 d-flex flex-column justify-content-center align-items-center">
        <h2 className="display-5 font-weight-bold mb-5">무엇이 궁금한가요?</h2>
        <Row className="justify-content-center w-100">
          <Col md={8} lg={6}>
            <InputGroup className="mb-4 shadow-sm">
              <Form.Control
                type="text"
                placeholder="질문을 입력해 주세요"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="py-3 text-center border-right-0"
              />
              <BsButton
                variant="outline-secondary"
                onClick={startVoiceInput}
                className="px-4"
                style={{
                  background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 0 15px rgba(219,39,119,0.3)'
                }}
              >
                🎤
              </BsButton>
            </InputGroup>
            {listening && <p className="text-muted mb-4">듣는 중...</p>}
            
            {isQuestionLoading ? (
              <div className="text-center mb-4">
                <div className="d-flex justify-content-center mb-3">
                  <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                    <span className="visually-hidden">로딩중...</span>
                  </div>
                </div>
                <p className="lead" style={{
                  background: 'linear-gradient(135deg, #9333EA, #EC4899, #3B82F6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: '600',
                  fontSize: '1.6rem',
                  letterSpacing: '0.5px',
                  textShadow: '0 0 5px rgba(147, 51, 234, 0.3)',
                  fontFamily: "'Noto Serif KR', serif, 'Arial', sans-serif",
                  animation: 'pulse 2s infinite',
                  padding: '10px',
                  margin: '10px auto',
                  border: '2px solid transparent',
                  borderImage: 'linear-gradient(45deg, #9333EA, #EC4899) 1',
                  borderRadius: '10px',
                  maxWidth: '450px'
                }}>
                  ✨ 타로 천사가 생각을 하고 있습니다! ✨
                </p>
                <style jsx>{`
                  @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                  }
                `}</style>
              </div>
            ) : (
              <BsButton 
                variant="primary"
                size="lg"
                className="py-3 px-5 w-50 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  border: 'none',
                  boxShadow: '0 0 20px rgba(99,102,241,0.4)'
                }}
                onClick={async () => {
                  if (question.trim() !== "") {
                    setIsQuestionLoading(true);
                    try {
                      // GPT로부터 카드 수 결정 받기
                      const cardCount = await determineCardCount(question);
                      setMaxSelectable(cardCount);
                    } catch (error) {
                      console.error("Error determining card count:", error);
                      // 오류 발생 시 기본값 유지
                    } finally {
                      setIsQuestionLoading(false);
                      setQuestionSubmitted(true);
                    }
                  }
                }}
              >
                입력
              </BsButton>
            )}
          </Col>
        </Row>
      </Container>
    );
  }

  if (selectedCards.length === maxSelectable && !showResult) {
    return (
      <Container className="py-5 text-center min-vh-100">
        <h2 className="display-5 font-weight-bold mb-5">✨ 당신이 선택한 카드 ✨</h2>
        <div className="d-flex justify-content-center mb-5" style={{ marginTop: "110px", minHeight: "250px" }}>
          {selectedCards.map((card, index) => (
            <div 
              key={card.id} 
              className="mx-n3 transform-gpu"
              style={{ 
                zIndex: selectedCards.length - index,
                transform: `scale(1.2) rotate(${(index-1) * 5}deg)`,
                transformOrigin: 'bottom center',
                transition: 'all 0.3s ease'
              }}
            >
              <motion.img
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                src={card.frontImage}
                alt={card.name}
                className="img-fluid rounded shadow-lg"
                style={{ 
                  maxWidth: '150px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          ))}
        </div>
        <p className="lead mb-5 text-muted">질문: {question || "(입력된 질문 없음)"}</p>
        {isLoading ? (
          <div className="text-center mb-5">
            <div className="d-flex justify-content-center mb-3">
              <div className="spinner-border text-success" role="status" style={{ width: "3rem", height: "3rem" }}>
                <span className="visually-hidden">로딩중...</span>
              </div>
            </div>
            <div className="progress mb-2" style={{ height: "10px", width: "300px", margin: "0 auto" }}>
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                role="progressbar" 
                style={{ width: `${loadingProgress}%` }}
                aria-valuenow={loadingProgress} 
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
            </div>
            <p className="text-muted">타로 카드를 해석하는 중입니다...</p>
          </div>
        ) : (
          <BsButton 
            variant="success"
            size="lg"
            className="py-3 px-5 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #10B981, #047857)',
              border: 'none',
              boxShadow: '0 0 20px rgba(16,185,129,0.4)'
            }}
            onClick={async () => {
              setIsLoading(true);
              const progressInterval = simulateProgress();
              try {
                const response = await fetchTarotInterpretation(selectedCards, question);
                setGptResponse(response);
                setShowResult(true);
              } finally {
                clearInterval(progressInterval);
                setIsLoading(false);
                setLoadingProgress(0);
              }
            }}
          >
            타로점 결과 보기
          </BsButton>
        )}
      </Container>
    );
  }

  if (showResult) {
    return (
      <Container className="py-5 text-center min-vh-100">
        <h2 className="display-4 font-weight-bold mb-5 text-purple-700">🔮 타로 해석 결과 🔮</h2>
        <BsCard className="mb-5 shadow-lg bg-light bg-opacity-80 backdrop-filter backdrop-blur-sm">
          <BsCard.Body className="p-4 p-md-5">
            <BsCard.Text className="lead text-start whitespace-pre-line">
              {gptResponse || "로딩 중..."}
            </BsCard.Text>
          </BsCard.Body>
        </BsCard>
        <BsButton 
          variant="warning"
          size="lg"
          className="py-3 px-5 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #F59E0B, #F43F5E)',
            border: 'none',
            boxShadow: '0 0 20px rgba(245,158,11,0.4)'
          }}
          onClick={() => {
            setSelectedCards([]);
            setShowResult(false);
            setQuestion("");
            setQuestionSubmitted(false);
            setGptResponse("");
          }}
        >
          질문하기
        </BsButton>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 position-relative min-vh-100 d-flex flex-column">
      <div className="text-center mb-5 w-100" style={{maxWidth: '1200px', margin: '0 auto'}}>
        <h2 className="display-5 font-weight-bold mb-2">🃏 {maxSelectable}장의 카드를 뽑으세요!</h2>
        <p className="text-muted mb-5">아래 카드 중에서 직관적으로 끌리는 카드를 선택하세요</p>
      </div>

      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-start" style={{marginTop: "60px"}}>
        <div className="w-100 d-flex flex-column align-items-center" style={{maxWidth: '1200px', margin: '0 auto'}}>
          {spreadChunks.map((chunk, index) => (
            <div key={index} className="position-relative w-100 d-flex justify-content-center mb-4" style={{ height: '160px', overflow: 'visible', marginTop: index === 0 ? '0' : '0' }}>
              <div className="position-absolute d-flex align-items-center" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                {chunk.map((card, i) => {
                  const isSelected = selectedCards.find((c) => c.id === card.id);
                  const cardWidth = 80; // 카드 너비
                  const totalCards = chunk.length;
                  const cardSpacing = 20; // 각 카드 사이 간격
                  const offset = i * cardSpacing; // 각 카드의 오프셋
                  const totalSpreadWidth = (totalCards - 1) * cardSpacing; // 전체 스프레드 너비
                  const startOffset = -totalSpreadWidth / 2; // 시작 위치 (중앙 정렬)

                  return (
                    <motion.div
                      key={card.id}
                      className="position-absolute cursor-pointer"
                      style={{
                        left: `${startOffset + offset}px`,
                        width: `${cardWidth}px`,
                        zIndex: isSelected ? 50 : (totalCards - i)
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: isSelected ? -25 : 0, // 선택된 카드는 위로 더 올라감
                        transition: {
                          delay: i * 0.01,
                          type: "spring",
                          stiffness: 100
                        }
                      }}
                      whileHover={{ 
                        y: -15, 
                        transition: { duration: 0.2 } 
                      }}
                      onClick={() => toggleCard(card)}
                    >
                      <motion.div
                        className="position-relative"
                        initial={false}
                        animate={{
                          rotateY: isSelected ? 180 : 0,
                          scale: isSelected ? 1.2 : 1,
                        }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      >
                        <motion.img
                          src={card.backImage}
                          alt="Card Back"
                          className={`rounded shadow ${isSelected ? 'opacity-0' : 'opacity-100'}`}
                          style={{
                            width: '80px',
                            height: 'auto',
                            filter: isSelected ? 'none' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))'
                          }}
                        />
                        <motion.img
                          src={card.frontImage}
                          alt={card.name}
                          className={`rounded shadow position-absolute top-0 start-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                          style={{
                            width: '80px',
                            height: 'auto',
                            transform: 'rotateY(180deg)',
                            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))'
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCards.length > 0 && (
        <div className="position-fixed bottom-0 start-0 end-0 d-flex justify-content-center mb-4">
          <Badge 
            pill 
            bg="light" 
            className="px-4 py-2 shadow" 
            style={{backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.8)'}}
          >
            <span className="fw-bold text-dark">{selectedCards.length}/{maxSelectable} 카드 선택됨</span>
          </Badge>
        </div>
      )}
    </Container>
  );
}