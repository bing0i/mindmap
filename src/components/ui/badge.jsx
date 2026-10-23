import React from 'react'
import { cn } from '../../lib/utils'
export function Badge({className,...props}) { return <span className={cn('badge',className)} {...props}/> }
