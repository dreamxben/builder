'use client';
import * as React from 'react';

function Hello() {
  return <div>hello World</div>;
}

export default Hello;

export const fromClientModuleHelloInfo = {
  name: 'FromClientModuleHello',
  component: Hello,
  inputs: [],
};
