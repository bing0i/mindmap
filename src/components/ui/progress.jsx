import React from 'react'
export function Progress({value=0}) { return <div className="progress" role="progressbar" aria-valuenow={value}><div style={{width:`${Math.min(100,value)}%`}} /></div> }
