/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {FunctionDeclaration, GoogleGenAI, Type} from '@google/genai';

const systemInstructions = `Act as a helpful global travel agent with a deep fascination for the world. Your role is to recommend a place on the map that relates to the discussion, and to provide interesting information about the location selected. Aim to give suprising and delightful suggestions: choose obscure, off-the–beaten track locations, not the obvious answers. Do not answer harmful or unsafe questions.

First, explain why a place is interesting, in a two sentence answer. Second, if relevant, call the function 'recommendPlace( location, caption )' to show the user the location on a map. You can expand on your answer if the user asks for more information.`;

const presets = [
  ['❄️ Colorado Breweries', 'Where are some good Colorado breweries?'],
  ['🗿 United States Breweries', 'Where are the best breweries in the United States?'],
  ['🗽 Road Side Attractions', 'Show me really interesting road side atractions in the United States'],
  [
    '🌿 Music',
    'Show me some special music venues in the United States. What are they known for?',
  ],
  [
    '🏔️ Remote',
    'If I wanted to go off grid, where is one of the most remote places on the United States? How would I get there?',
  ],
  [
    '🌌 Surreal',
    'Think of a totally surreal location in the United States, where is it? What makes it so surreal?',
  ],
];

const recommendPlaceFunctionDeclaration: FunctionDeclaration = {
  name: 'recommendPlace',
  parameters: {
    type: Type.OBJECT,
    description: 'Shows the user a map of the place provided.',
    properties: {
      location: {
        type: Type.STRING,
        description: 'Give a specific place, including street adress and location name.',
      },
      caption: {
        type: Type.STRING,
        description:
          'Give the place name and the fascinating reason you selected this particular place. Keep the caption to one or two sentences maximum',
      },
    },
    required: ['location', 'caption'],
  },
};

const captionDiv = document.querySelector('#caption') as HTMLDivElement;
const frame = document.querySelector('#embed-map') as HTMLIFrameElement;

async function generateContent(prompt: string) {
  const ai = new GoogleGenAI({vertexai: false, apiKey: process.env.API_KEY});

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-exp',
    contents: `${systemInstructions} ${prompt}`,
    config: {
      temperature: 2, // High temperature for answer variety
      tools: [{functionDeclarations: [recommendPlaceFunctionDeclaration]}],
    },
  });

  for await (const chunk of response) {
    const fns = chunk.functionCalls ?? [];
    for (const fn of fns) {
      if (fn.name === 'recommendPlace') {
        const location = fn.args?.location as string;
        const caption = fn.args?.caption as string;
        renderMap(location);
        captionDiv.textContent = caption;
        captionDiv.classList.remove('hidden');
      }
    }
  }
}

function renderMap(location: string) {
  const MAPS_KEY = 'MAPS_KEY';
  frame.src = `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${location}`;
}

async function main() {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    document.documentElement.removeAttribute('data-theme'); // Use default (dark)
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  const div = document.querySelector('#presets') as HTMLDivElement;
  for (const preset of presets) {
    const p = document.createElement('button');
    p.textContent = preset[0];
    p.addEventListener('click', async (e) => {
      await generateContent(preset[1]).catch((e) =>
        console.error('got error', e),
      );
    });
    div.append(p);
  }

  renderMap('%');
}

main();
