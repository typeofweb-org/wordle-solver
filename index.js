// @ts-check

import Fsp from "fs/promises";
import Path from "path";
import Inquirer from "inquirer";

const dictionary = (
  await Fsp.readFile(
    Path.join(Path.dirname(new URL(import.meta.url).pathname), "sgb-words.txt"),
    "utf-8"
  )
)
  .split("\n")
  .map((w) => w.trim().toLocaleUpperCase())
  .filter((w) => w.length > 0);

const randomInt = (/** @type {number} */ max) =>
  Math.floor(Math.random() * max);

const randomArrayItem = (/** @type {any[]} */ arr) =>
  arr[randomInt(arr.length)];

/**
 * @param {{ skip: { letter: string, idx: number }[], found: { letter: string, idx: number }[], correct: { letter: string, idx: number }[] }} processedResults
 * @param {string[]} suggestions
 * @returns
 */
async function next(
  suggestions = [
    // "ADIEU",
    // "AUDIO",
    // "AULOI",
    // "AUREI",
    // "LOUIE",
    // "MIAOU",
    // "OUIJA",
    // "OURIE",
    // "URAEI",
    "WEARY",
  ],
  processedResults = { skip: [], found: [], correct: [] },
  dict = dictionary
) {
  /**
   * @type {{input: string}}
   */
  const inputAnswer = { input: randomArrayItem(suggestions) };
  // const inputAnswer = await Inquirer.prompt({
  //   name: "input",
  //   message: "Your guess",
  //   validate: (input) => input.length === 5,
  //   transformer: (input) => input.toLocaleUpperCase(),
  // });

  console.log(`Your guess is: ${inputAnswer.input}`);

  /**
   * @type {Record<string, "skip" | "correct" | "found">[]}
   */
  const results = await inputAnswer.input
    .toLocaleUpperCase()
    .split("")
    .map((letter, idx) => ({
      name: letter,
      message: letter,
      type: "expand",
      choices: [
        {
          name: "skip",
          value: "skip",
          key: "s",
        },
        {
          name: "correct letter and position",
          value: "correct",
          key: "d",
        },
        {
          name: "correct letter but not position",
          value: "found",
          key: "f",
        },
      ],
    }))
    .reduce(async (acc, q) => {
      return [...(await acc), await Inquirer.prompt(q)];
    }, Promise.resolve([]));

  const newProcessedResults = results
    .map((v, idx) => [...Object.entries(v)[0], idx])
    .reduce((acc, item) => {
      return {
        ...acc,
        [item[1]]: [...acc[item[1]], { letter: item[0], idx: item[2] }],
      };
    }, processedResults);

  const newSuggestions = dict.filter((word) => {
    const shouldSkip = newProcessedResults.skip.some((skip) =>
      word.includes(skip.letter)
    );
    if (shouldSkip) {
      return false;
    }

    const includesFoundLetters = newProcessedResults.found.every(
      (found) => word.includes(found.letter) && word[found.idx] !== found.letter
    );
    if (!includesFoundLetters) {
      return false;
    }

    const includesCorrectLetters = newProcessedResults.correct.every(
      (correct) => word[correct.idx] === correct.letter
    );
    if (!includesCorrectLetters) {
      return false;
    }

    return true;
  });

  console.log(`\n`);

  if (newSuggestions.length === 1) {
    console.log(`The answer is: ${newSuggestions[0]}`);
    return;
  }

  if (newSuggestions.length === 0) {
    console.log(`No answer found :(`);
    return;
  }

  return next(newSuggestions, newProcessedResults, newSuggestions);
}

await next();
