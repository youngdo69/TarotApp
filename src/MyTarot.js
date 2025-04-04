import React, { useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { motion } from "framer-motion";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button as BsButton, Form, InputGroup, Card as BsCard, Container, Row, Col, Badge } from 'react-bootstrap';

// Create React App 환경변수 접근 방식 사용
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

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
    console.log('API 요청 시작:', { cardNames, question });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            "role": "system",
            "content": "당신은 경험 많은 타로 리더입니다. 직관적이고 영적인 해석을 제공합니다."
          },
          {
            "role": "user",
            "content": `다음은 사용자가 뽑은 타로 카드입니다: ${cardNames}. 이 사람의 질문은: "${question}". 이 카드들의 의미를 종합해서 직관적이고 영적인 타로 해석을 해 주세요. 한국어로 답해주세요.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API 요청 실패 (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    console.log('API 응답:', data);

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('응답 형식이 올바르지 않습니다: ' + JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error fetching tarot interpretation:', error);

    if (error.message.includes('401')) {
      return "API 키 인증에 실패했습니다. API 키가 올바른지 확인해주세요.";
    } else if (error.message.includes('429')) {
      return "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
    } else if (error.message.includes('500')) {
      return "OpenAI 서버에 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }

    return "죄송합니다. 타로 해석을 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.\n\n오류: " + error.message;
  }
};

const determineCardCount = async (question) => {
  try {
    console.log('카드 수 결정 API 요청 시작:', { question });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            "role": "system",
            "content": "당신은 타로 전문가입니다. 주어진 질문에 가장 적합한 카드 수를 결정해주세요."
          },
          {
            "role": "user",
            "content": `사용자가 "${question}"이라는 질문을 했습니다. 이 질문에 가장 적합한 타로 카드 수를 결정해주세요. 최소 1장, 최대 5장 사이로 결정해주세요. 숫자만 출력해주세요.`
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API 요청 실패 (${response.status}): ${errorData}`);
      return 3;
    }

    const data = await response.json();
    console.log('카드 수 결정 응답:', data);

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const cardCount = parseInt(data.choices[0].message.content.match(/\d+/)?.[0] || "3");
      return Math.min(Math.max(cardCount, 1), 5);
    } else {
      console.error('유효하지 않은 응답 형식:', data);
      return 3;
    }
  } catch (error) {
    console.error('Error determining card count:', error);
    return 3;
  }
};
