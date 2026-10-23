import '../dist/data.js'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Background, Controls, Handle, MiniMap, Position, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ExternalLink, Focus, Github, Map as MapIcon, Menu, Moon, PanelLeftClose, PanelLeftOpen, RotateCcw, Search, Sun, X } from 'lucide-react'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Progress } from './components/ui/progress'
import { Separator } from './components/ui/separator'
import { Tooltip, TooltipProvider } from './components/ui/tooltip'
import '@xyflow/react/dist/style.css'
import './styles.css'

const { LEVELS, CATEGORIES, S, NODES, PATHS, STUDY } = window.ATLAS
const STORAGE='javascript-atlas-progress-v2'
const EXPANDED='javascript-atlas-expanded-v1', MODE='javascript-atlas-mode-v1'
const WIDTH=220, HEIGHT=84
const byId=new Map(NODES.map(n=>[n.id,n]))
const childrenOf=new Map(NODES.map(n=>[n.id,NODES.filter(x=>x.parent===n.id).map(x=>x.id)]))
function withAncestors(ids){const result=new Set(ids);for(const id of [...result]){let n=byId.get(id);while(n?.parent){result.add(n.parent);n=byId.get(n.parent)}}return result}

function layoutGraph(nodes, edges){
  const graph=new dagre.graphlib.Graph().setDefaultEdgeLabel(()=>({}));
  graph.setGraph({rankdir:'LR',ranksep:110,nodesep:34,marginx:50,marginy:50});
  nodes.forEach(n=>graph.setNode(n.id,{width:WIDTH,height:HEIGHT}));
  edges.forEach(e=>graph.setEdge(e.source,e.target)); dagre.layout(graph);
  return nodes.map(n=>{const p=graph.node(n.id);return {...n,position:{x:p.x-WIDTH/2,y:p.y-HEIGHT/2}}})
}

const TopicNode=memo(({data,selected})=>{
  const cat=CATEGORIES[data.category]
  return <div className={`topic-node ${selected?'selected':''} ${data.done?'done':''}`} style={{'--accent':cat.color}}>
    <Handle type="target" position={Position.Left}/><div className="node-top"><span>{cat.label}</span>{data.done&&<Check size={14}/>}</div><strong>{data.title}</strong><div className="node-bottom"><span>{LEVELS[data.level]}</span>{data.hasChildren?<button className="expand-node" onClick={e=>{e.stopPropagation();data.toggle(data.id)}} aria-label={data.expanded?'Collapse branch':'Expand branch'}>{data.expanded?<ChevronDown/>:<ChevronRight/>}{data.expanded?'Collapse':`${data.childCount} more`}</button>:<span>Study</span>}</div><Handle type="source" position={Position.Right}/>
  </div>
})

function Atlas(){
  const [done,setDone]=useState(()=>new Set(JSON.parse(localStorage.getItem(STORAGE)||'[]')))
  const [expanded,setExpanded]=useState(()=>new Set(JSON.parse(localStorage.getItem(EXPANDED)||'[]')))
  const [mode,setMode]=useState(()=>localStorage.getItem(MODE)||'explore')
  const [selected,setSelected]=useState(null), [query,setQuery]=useState(''), [category,setCategory]=useState('all'), [path,setPath]=useState('all')
  const [sidebar,setSidebar]=useState(true), [mobile,setMobile]=useState(false), [dark,setDark]=useState(()=>localStorage.getItem('atlas-theme')!=='light')
  const rf=useReactFlow()
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('atlas-theme',dark?'dark':'light')},[dark])
  useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify([...done])),[done])
  useEffect(()=>localStorage.setItem(EXPANDED,JSON.stringify([...expanded])),[expanded])
  useEffect(()=>localStorage.setItem(MODE,mode),[mode])
  const toggleExpand=useCallback(id=>setExpanded(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next}),[])
  const visibleIds=useMemo(()=>{
    const p=PATHS.find(x=>x.id===path), allowed=p?new Set(['atlas',...p.nodes]):null, q=query.toLowerCase().trim(), hasFilter=category!=='all'||!!p||!!q
    const matched=NODES.filter(n=>(category==='all'||n.category===category)&&(!allowed||allowed.has(n.id))&&(!q||`${n.title} ${n.summary} ${n.points.join(' ')}`.toLowerCase().includes(q))).map(n=>n.id)
    if(hasFilter)return withAncestors(matched)
    if(mode==='overview')return new Set(NODES.map(n=>n.id))
    const shown=new Set(['atlas']);let changed=true
    while(changed){changed=false;for(const n of NODES){if(n.parent&&shown.has(n.parent)&&expanded.has(n.parent)&&!shown.has(n.id)){shown.add(n.id);changed=true}}}
    return shown
  },[query,category,path,mode,expanded])
  const graph=useMemo(()=>{
    const base=NODES.map(n=>({id:n.id,type:'topic',data:{...n,done:done.has(n.id),expanded:expanded.has(n.id),hasChildren:childrenOf.get(n.id).length>0,childCount:childrenOf.get(n.id).length,toggle:toggleExpand}}))
    const edges=NODES.filter(n=>n.parent).map(n=>({id:`${n.parent}-${n.id}`,source:n.parent,target:n.id,type:'smoothstep'}))
    return {nodes:layoutGraph(base,edges).map(n=>({...n,hidden:!visibleIds.has(n.id)})),edges:edges.map(e=>({...e,hidden:!visibleIds.has(e.source)||!visibleIds.has(e.target)}))}
  },[done,visibleIds,expanded,toggleExpand])
  const lesson=NODES.find(n=>n.id===selected), source=lesson?(S[lesson.source]||S.mdn):null
  const study=lesson?(STUDY[lesson.id]||{model:lesson.summary,example:lesson.points[0],practice:`Build the smallest working example of ${lesson.title}. Change one assumption and explain the result.`,check:`Explain ${lesson.title} without jargon. What breaks when it is misunderstood?`}):null
  const toggleDone=useCallback(id=>setDone(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);return next}),[])
  const reset=()=>{setQuery('');setCategory('all');setPath('all');setTimeout(()=>rf.fitView({padding:.15,duration:500}),50)}
  const choosePath=id=>{setPath(id);setQuery('');setCategory('all');setTimeout(()=>rf.fitView({padding:.18,duration:500}),70);setMobile(false)}
  return <TooltipProvider delayDuration={300}>
    <div className="app-shell">
      <header className="app-header">
        <Button variant="ghost" size="icon" className="mobile-only" onClick={()=>setMobile(true)} aria-label="Open menu"><Menu/></Button>
        <div className="logo"><span>JS</span><div><strong>JavaScript Atlas</strong><small>Engineering knowledge map</small></div></div>
        <div className="header-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search 69 lessons…"/><kbd>⌘ K</kbd></div>
        <div className="header-actions"><div className="overall"><span>{done.size} of {NODES.length}</span><Progress value={done.size/NODES.length*100}/></div><Tooltip label={dark?'Use light theme':'Use dark theme'}><Button variant="ghost" size="icon" onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</Button></Tooltip><Tooltip label="View source on GitHub"><Button variant="ghost" size="icon" asChild><a href="https://github.com/bing0i/mindmap" target="_blank" rel="noreferrer"><Github/></a></Button></Tooltip></div>
      </header>
      <aside className={`sidebar ${sidebar?'':'collapsed'} ${mobile?'mobile-open':''}`}>
        <div className="sidebar-head"><span>CURRICULUM</span><Button variant="ghost" size="icon" onClick={()=>setMobile(false)} className="mobile-only"><X/></Button></div>
        <div className="sidebar-scroll">
          <label className="side-label">LEARNING PATH</label>
          <button className={`path-row ${path==='all'?'active':''}`} onClick={()=>choosePath('all')}><MapIcon/><span><strong>Complete atlas</strong><small>All {NODES.length} lessons</small></span></button>
          {PATHS.map((p,i)=><button key={p.id} className={`path-row ${path===p.id?'active':''}`} onClick={()=>choosePath(p.id)}><span className="path-icon">0{i+1}</span><span><strong>{p.title}</strong><small>{p.nodes.filter(id=>done.has(id)).length}/{p.nodes.length} complete</small></span></button>)}
          <Separator/><label className="side-label">DOMAINS</label>
          <button className={`domain-row ${category==='all'?'active':''}`} onClick={()=>setCategory('all')}><i className="domain-dot all"/>All domains<span>{NODES.length}</span></button>
          {Object.entries(CATEGORIES).map(([id,c])=><button key={id} className={`domain-row ${category===id?'active':''}`} onClick={()=>{setCategory(id);setPath('all')}}><i className="domain-dot" style={{background:c.color}}/>{c.label}<span>{NODES.filter(n=>n.category===id).length}</span></button>)}
        </div>
        <div className="sidebar-foot"><CircleHelp size={15}/><span>Use the arrow inside a node to reveal its children. Open branches and progress are saved on this device.</span></div>
      </aside>
      {mobile&&<div className="mobile-backdrop" onClick={()=>setMobile(false)}/>} 
      <main className={`canvas ${sidebar?'':'wide'} ${lesson?'lesson-open':''}`}>
        <Button className="collapse" variant="secondary" size="icon" onClick={()=>setSidebar(!sidebar)} aria-label="Toggle sidebar">{sidebar?<PanelLeftClose/>:<PanelLeftOpen/>}</Button>
        <div className="canvas-bar"><div><div className="mode-switch" role="group" aria-label="Map mode"><button className={mode==='explore'?'active':''} onClick={()=>setMode('explore')}>Explore</button><button className={mode==='overview'?'active':''} onClick={()=>setMode('overview')}>Overview</button></div><Badge>{path==='all'?'Complete atlas':PATHS.find(p=>p.id===path)?.title}</Badge><span>{visibleIds.size} concepts visible</span></div><div><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filter domain"><option value="all">All domains</option>{Object.entries(CATEGORIES).map(([id,c])=><option key={id} value={id}>{c.label}</option>)}</select><Tooltip label="Reset filters and view"><Button variant="outline" size="sm" onClick={reset}><RotateCcw/>Reset</Button></Tooltip></div></div>
        <ReactFlow nodes={graph.nodes} edges={graph.edges} nodeTypes={{topic:TopicNode}} onNodeClick={(_,n)=>setSelected(n.id)} fitView fitViewOptions={{padding:.15}} minZoom={.15} maxZoom={1.6} nodesDraggable={false} proOptions={{hideAttribution:false}}>
          <Background gap={22} size={1}/><Controls position="bottom-right" showInteractive={false}/><MiniMap position="bottom-left" pannable zoomable nodeColor={n=>CATEGORIES[n.data.category]?.color||'#888'} maskColor="rgba(9,9,11,.75)"/>
        </ReactFlow>
        <div className="map-tip"><Focus size={14}/> Drag to pan · Scroll to zoom · Select a concept</div>
      </main>
      <aside className={`lesson ${lesson?'open':''}`} aria-hidden={!lesson}>
        {lesson&&<><div className="lesson-head"><Button variant="ghost" size="icon" onClick={()=>setSelected(null)}><ChevronLeft/></Button><span>STUDY NOTE</span><Button variant="ghost" size="icon" onClick={()=>setSelected(null)}><X/></Button></div><div className="lesson-scroll"><div className="lesson-tags"><Badge style={{'--badge':CATEGORIES[lesson.category].color}}>{CATEGORIES[lesson.category].label}</Badge><Badge>{LEVELS[lesson.level]}</Badge><span>3–5 min</span></div><h1>{lesson.title}</h1><p className="lesson-why">WHY IT MATTERS · {lesson.why}</p><Separator/><div className="lesson-body"><h3>Mental model</h3><p>{study.model}</p><h3>Concrete example</h3><pre><code>{study.example}</code></pre><h3>Rules worth keeping</h3><ul>{lesson.points.map(p=><li key={p}>{p}</li>)}</ul><div className="practice-block"><h3>Practice it</h3><p>{study.practice}</p></div><div className="recall-block"><h3>Check yourself</h3><p>{study.check}</p><small>Answer aloud before opening the source.</small></div></div><a className="source-card" href={source[1]} target="_blank" rel="noreferrer"><BookOpen/><span><small>PRIMARY SOURCE</small><strong>{source[0]}</strong></span><ExternalLink/></a></div><div className="lesson-action"><Button className={done.has(lesson.id)?'completed':''} onClick={()=>toggleDone(lesson.id)}>{done.has(lesson.id)?<><Check/>Completed</>:<>I can explain this — mark complete</>}</Button></div></>}
      </aside>
    </div>
  </TooltipProvider>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><ReactFlowProvider><Atlas/></ReactFlowProvider></React.StrictMode>)
