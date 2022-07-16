import { faker } from '@faker-js/faker';
import * as _ from 'lodash';

export type RootCauseItemBody = {
  id: number,
  type: string,
  ope_no: string,
  factor: string,
  score: number,
}


const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

const makeData = (len: number) => {
  const data: RootCauseItemBody[] = [];

  const toolTypes: string[] = [];
  const rcpTypes: string[] = [];

  for (const i of _.range(50)) {
    toolTypes.push(faker.random.alphaNumeric(6, {casing: 'upper'}))
  }

  for (const i of _.range(50)) {
    rcpTypes.push(faker.random.alphaNumeric(getRandomInt(10, 20), {casing: 'upper'}))
  }

  for (const i of _.range(len)) {
    const type = faker.helpers.arrayElement(['tool', 'recipe', 'chamber', 'self-check']);
    let factor = 'unknown';
    if (type === 'tool' || type === 'self-check') {
      factor = faker.helpers.arrayElement(toolTypes)
    }
    if (type === 'recipe') {
      factor = faker.helpers.arrayElement(rcpTypes)
    }
    if (type === 'chamber') {
      factor = faker.helpers.arrayElement(toolTypes) + '_CH_' + faker.random.alphaNumeric(1, {casing: 'upper'})
    }
    data.push({
      id: i,
      type: type,
      ope_no: faker.finance.amount(100, 10000, 3),
      factor: factor,
      score: Number(faker.finance.amount(0, 100, 2)),
    })
  }

  return data;
}

export default makeData;