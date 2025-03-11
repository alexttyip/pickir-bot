export const getAtmosphericNoiseRandomInteger = async (
  min: number,
  max: number,
  n = 1,
): Promise<number> => {
  const body = {
    jsonrpc: "2.0",
    method: "generateIntegers",
    params: {
      apiKey: "4677204d-8290-4fa8-8c22-c4b4866e9021",
      n,
      min,
      max,
    },
    id: 69,
  };

  const res = await fetch("https://api.random.org/json-rpc/4/invoke", {
    method: "post",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  const json = (await res.json()) as {
    result: { random: { data: number[] } };
    error?: { message: string };
  };

  if (json.error) {
    throw new Error(json.error.message);
  }

  const data = json.result.random.data;
  if (data.length === 0) {
    throw new Error("No random numbers generated");
  }

  // Disabling rule since it's explicitly checked in the if statement
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return data[0]!;
};

export const getRandomInteger = (max: number): number => Math.floor(Math.random() * max);

const normalise = (weights: number[]): number[] => {
  const sumOfWeights = weights.reduce((a,b)=>a+b)
  return weights.map( a => a / sumOfWeights)
}

export const getWeightedRandomInteger = (weights: number[]): number => {
  // based off of https://stackoverflow.com/a/57130749

  const normalisedWeights = normalise(weights);
  const cumulativeWeights = normalisedWeights.map((sum => value => sum += value)(0));
  const randomNumber = Math.random();
  return cumulativeWeights.findIndex(weight => randomNumber <= weight);
}
