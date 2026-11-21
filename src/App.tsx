import { useEffect, useMemo, useRef, useState } from 'react'

type Screen = 'home' | 'explore' | 'create' | 'profile' | 'customize' | 'scrapbooks' | 'settings' | 'saved'
type IconName =
  | 'home' | 'compass' | 'plus' | 'user' | 'grid' | 'heart' | 'bookmark' | 'repeat'
  | 'more' | 'music' | 'arrow' | 'search' | 'camera' | 'type' | 'image' | 'headphones'
  | 'settings' | 'edit' | 'play' | 'pause' | 'close' | 'sparkle' | 'share' | 'link'
  | 'check' | 'trash' | 'lock' | 'globe' | 'upload' | 'send'

type Post = {
  id: number
  user: string
  handle: string
  avatar: string
  type: 'photo' | 'quote' | 'music' | 'moodboard' | 'mixtape'
  image?: string
  images?: string[]
  moodboardLayout?: 'editorial' | 'grid' | 'stack'
  song?: { title: string; artist: string }
  mixtapeTitle?: string
  tracks?: MixtapeTrack[]
  curated?: boolean
  time: string
  caption: string
  tags: string[]
  notes: number
  owner?: boolean
  visibility?: string
  reblogOf?: { user: string; handle: string; id: number }
}

type MixtapeTrack = { id: number; title: string; artist: string; url?: string; artwork?: string }
type Fragment = { id: number; type: 'photo' | 'quote' | 'music' | 'saved'; value: string; image?: string }
type Scrapbook = { id: number; title: string; privacy: 'Private' | 'Public'; fragments: Fragment[]; cover: string }
type ArchiveLayout = 'grid' | 'journal' | 'collage'

const defaultProfileCustomization = { color:'#9a8db4', font:'editorial', layout:'grid' as ArchiveLayout, background:'#111014', style:'classic' }

function normalizeArchiveLayout(value: unknown): ArchiveLayout {
  const normalized=typeof value==='string'?value.trim().toLowerCase():''
  return normalized==='journal'||normalized==='collage'?normalized:'grid'
}

function normalizeProfileCustomization(value: any) {
  const source=value&&typeof value==='object'?value:{}
  const { archiveLayout: legacyArchiveLayout, ...current }=source
  return {
    ...defaultProfileCustomization,
    ...current,
    layout:normalizeArchiveLayout(source.layout??legacyArchiveLayout),
  }
}

const images = {
  portrait: '/assets/afterhours-portrait.png',
  city: '/assets/afterhours-city.png',
  stilllife: '/assets/afterhours-stilllife.png',
}

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5M9 21v-7h6v7"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>, user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z"/>, repeat: <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  music: <><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></>,
  arrow: <><path d="m15 18-6-6 6-6"/></>, search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  camera: <><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z"/><circle cx="12" cy="13" r="4"/></>,
  type: <><path d="M5 5h14M12 5v14M8 19h8"/></>, image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m21 15-5-5L5 20"/></>,
  headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v6H4zM17 14h3v6h-3z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  edit: <><path d="m14 5 5 5L8 21H3v-5L14 5Z"/><path d="m12 7 5 5"/></>, play: <path d="m8 5 11 7-11 7V5Z"/>,
  pause: <><path d="M8 5v14M16 5v14"/></>, close: <><path d="M6 6l12 12M18 6 6 18"/></>,
  sparkle: <><path d="m12 2 1.3 5.7L19 9l-5.7 1.3L12 16l-1.3-5.7L5 9l5.7-1.3L12 2Z"/><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></>,
  check: <path d="m5 12 4 4L19 6"/>, trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 15v5h16v-5"/></>, send: <><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></>,
}

function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback } catch { return fallback }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`AFTERHOURS could not persist ${key}`, error)
    }
  }, [key, value])
  return [value, setValue] as const
}

const initialPosts: Post[] = [
  { id: 1, user: 'mina after midnight', handle: '@softstatic', avatar: images.portrait, type: 'photo', image: images.city, time: '2:17 AM', caption: 'the city looks softer when no one expects anything from you.', tags: ['#nightwalks', '#35mm'], notes: 284 },
  { id: 2, user: 'paperghost', handle: '@paperghost', avatar: images.stilllife, type: 'quote', time: '1:03 AM', caption: 'I want a life that feels like finding a note in the pocket of an old coat.', tags: ['#words', '#personal'], notes: 91 },
  { id: 3, user: 'velvet cassette', handle: '@velvetcassette', avatar: images.city, type: 'music', image: images.stilllife, song: { title: 'Space Song', artist: 'Beach House' }, time: '12:48 AM', caption: 'for staring out the bus window like you are in the final scene', tags: ['#playlist', '#dream pop'], notes: 417 },
  { id: 4, user: 'luna, offline', handle: '@lunaoffline', avatar: images.portrait, type: 'photo', image: images.portrait, time: 'yesterday', caption: 'proof that I existed here, for a moment.', tags: ['#personal', '#self portrait'], notes: 53, owner: true },
]

const purpleMixtape: Post = {
  id:-217,
  user:'AFTERHOURS editorial',
  handle:'@afterhours',
  avatar:images.city,
  type:'mixtape',
  image:images.city,
  time:'curated tonight',
  caption:'Five songs suspended somewhere between violet light, slow dancing, and the last train home.',
  mixtapeTitle:'songs that feel like purple',
  tags:['#afterhours mixtapes','#dream pop','#darkwave'],
  notes:486,
  visibility:'Public',
  curated:true,
  tracks:[
    {id:1,title:'Space Song',artist:'Beach House',url:'https://open.spotify.com/search/Space%20Song%20Beach%20House',artwork:images.stilllife},
    {id:2,title:'Apocalypse',artist:'Cigarettes After Sex',url:'https://open.spotify.com/search/Apocalypse%20Cigarettes%20After%20Sex'},
    {id:3,title:'After Dark',artist:'Mr.Kitty',url:'https://open.spotify.com/search/After%20Dark%20Mr.Kitty',artwork:images.city},
    {id:4,title:'The Perfect Girl',artist:'Mareux',url:'https://open.spotify.com/search/The%20Perfect%20Girl%20Mareux'},
    {id:5,title:'Show Me How',artist:'Men I Trust',url:'https://open.spotify.com/search/Show%20Me%20How%20Men%20I%20Trust',artwork:images.portrait},
  ],
}

type DiscoveryPost = { title: string; image?: string; copy?: string; post?: Post }
const discovery: Record<string, { title: string; description: string; image: string; members: string; posts: DiscoveryPost[] }> = {
  'For you': { title: 'soft static', description: 'blurry nights, quiet songs, and things that almost happened.', image: images.city, members: '3.2k', posts: [{ title: 'after midnight', image: images.portrait }, { title: 'maybe becoming yourself is just remembering.', copy: 'POETRY' }, { title: 'analog rituals', image: images.stilllife }, { title: 'songs that feel like purple', copy: 'MIXTAPE', post:purpleMixtape }] },
  Indie: { title: 'bedroom transmissions', description: 'zines, demo tapes, basement shows, and beautiful unfinished things.', image: images.stilllife, members: '1.8k', posts: [{ title: 'xerox hearts', image: images.stilllife }, { title: 'made in a bedroom, meant for everywhere', copy: 'DIY' }, { title: 'midnight demo', image: images.city }, { title: 'small shows, big feelings', copy: 'SCENE' }] },
  Fashion: { title: 'the dressing room', description: 'personal style without rules, trends, or shopping links.', image: images.portrait, members: '4.7k', posts: [{ title: 'soft armor', image: images.portrait }, { title: 'dress like the person in your diary', copy: 'STYLE' }, { title: 'silver / charcoal', image: images.stilllife }, { title: 'thrifted futures', copy: 'ARCHIVE' }] },
  Music: { title: 'songs for no one', description: 'deep cuts, liner notes, playlists, and songs you keep private.', image: images.stilllife, members: '6.1k', posts: [{ title: 'violet frequencies', image: images.stilllife }, { title: 'a chorus can be a place to hide', copy: 'LISTEN' }, { title: 'night bus mix', image: images.city }, { title: 'songs that feel like purple', copy: 'MIXTAPE', post:purpleMixtape }] },
  Photography: { title: 'available light', description: 'film grain, missed focus, honest portraits, no perfect moments.', image: images.city, members: '5.4k', posts: [{ title: 'rain on glass', image: images.city }, { title: 'blur is a kind of memory', copy: '35MM' }, { title: 'self-timer', image: images.portrait }, { title: 'contact sheets', image: images.stilllife }] },
  Poetry: { title: 'margin notes', description: 'fragments, confessions, tiny poems, and words without audiences.', image: images.city, members: '2.9k', posts: [{ title: 'unfinished letter', copy: 'VERSE' }, { title: 'the night kept my secret', image: images.city }, { title: 'notes app elegy', copy: 'WORDS' }, { title: 'found poem', image: images.stilllife }] },
  Art: { title: 'unfinished works', description: 'sketchbooks, experiments, digital debris, and works in progress.', image: images.stilllife, members: '3.8k', posts: [{ title: 'violet study', image: images.stilllife }, { title: 'art does not need permission', copy: 'STUDIO' }, { title: 'digital decay', image: images.city }, { title: 'page 47', image: images.portrait }] },
}

const musicLibrary = [
  { title: 'Space Song', artist: 'Beach House' }, { title: 'Myth', artist: 'Beach House' },
  { title: 'Fade Into You', artist: 'Mazzy Star' }, { title: 'When the Sun Hits', artist: 'Slowdive' },
]

function Header({ title, subtitle, back, onBack, action }: { title: string; subtitle?: string; back?: boolean; onBack?: () => void; action?: React.ReactNode }) {
  return <header className="page-header"><div className="header-side">{back && <button className="icon-button" onClick={onBack} aria-label="Back"><Icon name="arrow" /></button>}</div><div className="header-title"><h1>{title}</h1>{subtitle && <span>{subtitle}</span>}</div><div className="header-side right">{action}</div></header>
}

function Logo() { return <div className="wordmark">AFTER<span>HOURS</span><i /></div> }

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="sheet-backdrop" onClick={onClose}><section className="action-sheet" onClick={e => e.stopPropagation()}><div className="sheet-head"><h2>{title}</h2><button className="icon-button" onClick={onClose}><Icon name="close"/></button></div>{children}</section></div>
}

function MoodboardGallery({ post, onPhoto, context = 'feed' }: { post: Post; onPhoto: (images: string[], index: number) => void; context?: 'feed' | 'modal' }) {
  const photographs = post.images?.length ? post.images : post.image ? [post.image] : []
  const layout = post.moodboardLayout || 'editorial'
  const [front, setFront] = useState(photographs.length - 1)
  const openPhoto = (event: React.MouseEvent, index: number) => {
    event.stopPropagation()
    if (layout === 'stack') setFront(index)
    onPhoto(photographs, index)
  }
  return <div className={`moodboard-gallery moodboard-${layout} moodboard-${context}`} data-count={photographs.length}>
    {photographs.map((src, index) => <button
      type="button"
      key={`${src}-${index}`}
      className={front === index ? 'is-front' : ''}
      style={layout === 'stack' ? { zIndex: front === index ? photographs.length + 1 : index + 1 } : undefined}
      onClick={event => openPhoto(event, index)}
      aria-label={layout === 'stack' && front !== index ? `Bring photograph ${index + 1} to front` : `View photograph ${index + 1} full screen`}
    ><img src={src} alt={`Moodboard photograph ${index + 1} of ${photographs.length}`} /><span>{index + 1}/{photographs.length}</span></button>)}
  </div>
}

function PostCard({ post, liked, saved, onLike, onSave, onReblog, onOpen, onMore, onPhoto }: any) {
  return <article className={`post-card ${post.type}`} onClick={() => onOpen(post)}>
    {post.reblogOf && <div className="reblog-credit"><Icon name="repeat" size={12}/> reblogged from <strong>{post.reblogOf.handle}</strong></div>}
    <div className="post-meta"><img src={post.avatar} alt="" /><div><strong>{post.user}</strong><span>{post.handle} · {post.time}</span></div><button className="icon-button" aria-label="Post options" onClick={e => { e.stopPropagation(); onMore(post) }}><Icon name="more" /></button></div>
    {post.type === 'photo' && <img className="post-image" src={post.image} alt="" />}
    {post.type === 'moodboard' && <MoodboardGallery post={post} onPhoto={onPhoto} />}
    {post.type === 'mixtape' && <div className="feed-mixtape"><img src={post.image||images.city} alt=""/><div><span>AFTERHOURS MIXTAPE · {post.tracks?.length||0} TRACKS</span><strong>{post.mixtapeTitle||'untitled mixtape'}</strong><small>open the tracklist</small></div></div>}
    {post.type === 'quote' && <div className="quote-post"><span>“</span><p>{post.caption}</p><small>— {post.handle}</small></div>}
    {post.type === 'music' && <div className="music-post"><img src={post.image || images.stilllife} alt="" /><div className="music-overlay"><button aria-label="Play simulated preview"><Icon name="play" filled size={17} /></button><div><strong>{post.song?.title || 'Space Song'}</strong><span>{post.song?.artist || 'Beach House'} · SIMULATED PREVIEW</span></div><div className="equalizer"><i/><i/><i/><i/></div></div></div>}
    {post.type !== 'quote' && <div className="post-copy"><p>{post.caption}</p><div>{post.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>}
    <div className="post-actions"><button className={liked ? 'active like' : ''} onClick={e => { e.stopPropagation(); onLike(post.id) }}><Icon name="heart" filled={liked} /><span>{post.notes + (liked ? 1 : 0)}</span></button><button onClick={e => { e.stopPropagation(); onReblog(post) }}><Icon name="repeat" /><span>{post.reblogOf ? 'reblogged' : 'reblog'}</span></button><button className={saved ? 'active' : ''} onClick={e => { e.stopPropagation(); onSave(post.id) }}><Icon name="bookmark" filled={saved} /></button></div>
  </article>
}

function Home(props: any) {
  const [tab, setTab] = useState('following')
  const shown = tab === 'following' ? props.posts : [...props.posts].reverse()
  return <div className="screen home-screen"><div className="home-top"><Logo /><button className="icon-button" onClick={props.onSearch}><Icon name="search" /></button></div><div className="feed-tabs"><button className={tab === 'following' ? 'active' : ''} onClick={() => setTab('following')}>Following</button><button className={tab === 'foryou' ? 'active' : ''} onClick={() => setTab('foryou')}>For you</button></div><div className="status-note"><i /><span>Your corner of the internet is quiet tonight.</span></div><div className="feed">{shown.map((post: Post) => <PostCard key={post.id} {...props} post={post} liked={props.liked.includes(post.id)} saved={props.saved.includes(post.id)} />)}</div></div>
}

function SearchView({ onBack, posts, openPost }: any) {
  const [query, setQuery] = useState('')
  const q = query.toLowerCase()
  const postResults = posts.filter((p: Post) => [p.mixtapeTitle||'',p.caption, p.user, p.handle, ...p.tags].join(' ').toLowerCase().includes(q))
  const communities = Object.entries(discovery).filter(([k, v]) => `${k} ${v.title} ${v.description}`.toLowerCase().includes(q))
  return <div className="subview"><Header title="Search" subtitle="posts · people · tags · rooms" back onBack={onBack}/><div className="search-field"><Icon name="search"/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="search the afterhours..." />{query && <button onClick={() => setQuery('')}><Icon name="close" size={15}/></button>}</div>
    {!query ? <div className="search-empty"><Icon name="sparkle" size={28}/><h2>Find your people</h2><p>Try “35mm”, “Beach House”, “fashion”, or “@paperghost”.</p><div>{['#nightwalks','#poetry','#dream pop','#personal style'].map(x => <button key={x} onClick={() => setQuery(x)}>{x}</button>)}</div></div> :
    <div className="search-results"><span className="result-label">{postResults.length} POSTS</span>{postResults.map((p: Post) => <button className="result-row" key={p.id} onClick={() => openPost(p)}><img src={p.image || p.avatar}/><div><strong>{p.caption}</strong><span>{p.handle} · {p.tags.join(' ')}</span></div></button>)}<span className="result-label">{communities.length} COMMUNITIES</span>{communities.map(([k,v]) => <div className="result-row" key={k}><img src={v.image}/><div><strong>{v.title}</strong><span>{v.members} members · {k}</span></div></div>)}{!postResults.length && !communities.length && <p className="no-results">Nothing here yet. Try a softer word.</p>}</div>}
  </div>
}

function Explore({ posts, onOpen }: any) {
  const [category, setCategory] = useState('For you')
  const [view, setView] = useState<'main'|'search'|'room'|'all'>('main')
  const [joined, setJoined] = useStored<string[]>('afterhours-joined', [])
  const publicMixtapes=(posts as Post[]).filter(post=>post.type==='mixtape'&&post.visibility==='Public')
  const categoryData=discovery[category]
  const data=category==='Music'&&publicMixtapes.length?{...categoryData,posts:[...categoryData.posts,...publicMixtapes.map(post=>({title:post.mixtapeTitle||post.caption,image:post.image,copy:'COMMUNITY MIXTAPE',post}))]}:categoryData
  if (view === 'search') return <SearchView onBack={() => setView('main')} posts={posts} openPost={onOpen}/>
  if (view === 'room') return <div className="subview community-page"><div className="community-hero"><img src={data.image}/><div className="featured-shade"/><button className="icon-button back-float" onClick={() => setView('main')}><Icon name="arrow"/></button><div><span>COMMUNITY</span><h1>{data.title}</h1><p>{data.description}</p></div></div><div className="community-stats"><div><strong>{data.members}</strong><span>members</span></div><div><strong>{data.posts.length * 327}</strong><span>fragments</span></div><button className={joined.includes(category) ? 'joined' : ''} onClick={() => setJoined(j => j.includes(category) ? j.filter(x => x !== category) : [...j, category])}>{joined.includes(category) ? 'Leave quietly' : 'Join the room'}</button></div><div className="room-note">A slow community. No rankings, no top posters.</div><DiscoveryGrid data={data} expanded onOpen={onOpen}/></div>
  if (view === 'all') return <div className="subview"><Header title={category} subtitle="all recent fragments" back onBack={() => setView('main')}/><DiscoveryGrid data={data} expanded onOpen={onOpen}/></div>
  return <div className="screen"><Header title="Explore" subtitle="find your frequency" action={<button className="icon-button" onClick={() => setView('search')}><Icon name="search" /></button>} /><div className="category-scroll">{Object.keys(discovery).map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><section className="featured-community"><img src={data.image}/><div className="featured-shade" /><div><span>COMMUNITY OF THE NIGHT</span><h2>{data.title}</h2><p>{data.members} people collecting {data.description}</p><button onClick={() => setView('room')}>enter the room <Icon name="arrow" size={15} /></button></div></section><div className="section-label"><span>TRENDING IN {category.toUpperCase()}</span><button onClick={() => setView('all')}>see all</button></div><DiscoveryGrid data={data} onOpen={onOpen}/></div>
}

function DiscoveryGrid({ data, expanded, onOpen }: any) {
  const cards = expanded ? [...data.posts, ...data.posts.map((p: any) => ({...p, title: `${p.title} — volume ii`}))] : data.posts
  return <div className={`explore-grid ${expanded ? 'expanded' : ''}`}>{cards.map((p: any, i: number) => {
    const editorial=!p.image&&i%4===3
    const quote=!p.image&&!editorial
    return <button key={`${p.title}-${i}`} className={`tile ${i%4===0?'tall':''} ${quote?'quote-tile':''} ${editorial?'lavender':''}`} onClick={() => onOpen(p.post||{ ...initialPosts[i%initialPosts.length], caption: p.title, image: p.image || data.image })}>
      {p.image&&<><img src={p.image}/><span className="tile-caption">{p.title}</span></>}
      {quote&&<div className="tile-quote-copy"><span>{p.copy}</span><p>“{p.title}”</p></div>}
      {editorial&&<div className="tile-editorial-copy"><Icon name={p.copy==='MUSIC'||p.copy==='MIXTAPE'?'music':'sparkle'} size={25}/><span>{p.copy}</span><strong>{p.title}</strong><small>explore the collection</small></div>}
    </button>
  })}</div>
}

function Create({ onPublish }: { onPublish: (post: Post) => Promise<void> }) {
  const [type, setType] = useState<'photo'|'text'|'moodboard'|'music'|'mixtape'>('photo')
  const [caption, setCaption] = useState('')
  const [privacy, setPrivacy] = useState('Public')
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [picker, setPicker] = useState<'media'|'music'|null>(null)
  const [selected, setSelected] = useState<string[]>([images.portrait])
  const [pendingSelected, setPendingSelected] = useState<string[]>([])
  const [song, setSong] = useState(musicLibrary[0])
  const [arrangement, setArrangement] = useState<'editorial'|'grid'|'stack'>('editorial')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [mixtapeTitle,setMixtapeTitle]=useState('')
  const [tracks,setTracks]=useState<MixtapeTrack[]>([])
  const [trackDraft,setTrackDraft]=useState({title:'',artist:'',url:''})
  const [trackError,setTrackError]=useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const publishingRef = useRef(false)
  const media = [images.portrait, images.city, images.stilllife, `${images.city}?frame=detail`]
  const normalizeUpload = (file: File) => new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`${file.name} is not a supported photograph`))
      return
    }
    const url = URL.createObjectURL(file)
    const photograph = new Image()
    photograph.onload = () => {
      const maximumEdge = 1200
      const scale = Math.min(1, maximumEdge / Math.max(photograph.naturalWidth, photograph.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(photograph.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(photograph.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(url)
        reject(new Error('This browser could not prepare the photograph'))
        return
      }
      context.drawImage(photograph, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const result = canvas.toDataURL('image/jpeg', .76)
      result === 'data:,' ? reject(new Error('The photograph could not be processed')) : resolve(result)
    }
    photograph.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`${file.name} could not be opened`))
    }
    photograph.src = url
  })
  const readUploads = async (files?: FileList | null) => {
    if (!files?.length) return
    setUploadError('')
    try {
      const uploaded = await Promise.all(Array.from(files).slice(0, 6).map(normalizeUpload))
      setPendingSelected(previous => {
        const intentional = [...previous, ...uploaded.filter(photo => !previous.includes(photo))]
        if (intentional.length > 6) setUploadError('A moodboard can hold up to six photographs.')
        return intentional.slice(0, 6)
      })
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'The selected photographs could not be added.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }
  const publish = async () => {
    if (publishingRef.current) return
    if (type === 'moodboard' && selected.length === 0) {
      setPublishError('Add at least one photograph before publishing this moodboard.')
      return
    }
    if(type==='mixtape'&&!mixtapeTitle.trim()){
      setPublishError('Give your mixtape a title before publishing.')
      return
    }
    if(type==='mixtape'&&!selected[0]){
      setPublishError('Add a cover photograph before publishing this mixtape.')
      return
    }
    if(type==='mixtape'&&!tracks.length){
      setPublishError('Add at least one track before publishing this mixtape.')
      return
    }
    publishingRef.current = true
    setPublishing(true)
    setPublishError('')
    const postType = type === 'text' ? 'quote' : type
    try {
      await onPublish({ id: Date.now(), user: 'luna, offline', handle: '@lunaoffline', avatar: images.portrait, type: postType, image: type === 'music' ? images.stilllife : selected[0], images: type === 'moodboard' ? [...selected] : undefined, moodboardLayout: type === 'moodboard' ? arrangement : undefined, song: type === 'music' ? song : undefined, mixtapeTitle:type==='mixtape'?mixtapeTitle.trim():undefined, tracks:type==='mixtape'?tracks:undefined, time: 'now', caption: caption || (type==='mixtape'?'a collection for the hours that do not belong to anyone.':'a small piece of tonight, kept here.'), tags: type==='mixtape'?['#afterhours mixtapes','#music','#personal']:['#personal', '#afterhours'], notes: 0, owner: true, visibility: privacy })
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'This post could not be published. Your draft is still here.')
      publishingRef.current = false
      setPublishing(false)
    }
  }
  const addTrack=()=>{
    if(tracks.length>=20){setTrackError('A mixtape can contain up to 20 tracks.');return}
    if(!trackDraft.title.trim()||!trackDraft.artist.trim()){setTrackError('Add both a song title and artist.');return}
    if(trackDraft.url.trim()){
      try{
        const host=new URL(trackDraft.url.trim()).hostname
        if(host!=='open.spotify.com'&&!host.endsWith('music.apple.com'))throw new Error()
      }catch{setTrackError('Use a valid Spotify or Apple Music link.');return}
    }
    setTracks(current=>[...current,{id:Date.now(),title:trackDraft.title.trim(),artist:trackDraft.artist.trim(),url:trackDraft.url.trim()||undefined}])
    setTrackDraft({title:'',artist:'',url:''})
    setTrackError('')
  }
  const moveTrack=(index:number,direction:number)=>setTracks(current=>{const destination=index+direction;if(destination<0||destination>=current.length)return current;const next=[...current];[next[index],next[destination]]=[next[destination],next[index]];return next})
  const privacyOptions=type==='mixtape'?['Public','Private']:['Public','Followers Only','Private']
  const types = [{key:'photo',icon:'camera',name:'Photo',detail:'a moment'},{key:'text',icon:'type',name:'Text',detail:'a thought'},{key:'moodboard',icon:'image',name:'Moodboard',detail:'a feeling'},{key:'music',icon:'headphones',name:'Music',detail:'a sound'},{key:'mixtape',icon:'music',name:'Mixtape',detail:'a collection'}] as const
  const openMediaPicker = () => {
    setPendingSelected([...selected])
    setUploadError('')
    setPicker('media')
  }
  return <div className="screen create-screen"><Header title="Create" subtitle="make something honest" /><p className="create-intro">What kind of piece are you making?</p><div className="create-types">{types.map(t => <button key={t.key} className={type === t.key ? 'active' : ''} onClick={() => { setType(t.key); setPublishError(''); if (t.key === 'moodboard'||t.key==='mixtape') { setSelected([]); setPendingSelected([]) } else if (t.key === 'photo') setSelected([images.portrait]); if(t.key==='mixtape'){setPrivacy('Public');setMixtapeTitle('');setCaption('');setTracks([])} }}><span><Icon name={t.icon}/></span><strong>{t.name}</strong><small>{t.detail}</small></button>)}</div><section className="composer"><div className="composer-user"><img src={images.portrait}/><div><strong>luna</strong><span>@lunaoffline</span></div><button onClick={() => setPrivacyOpen(!privacyOpen)}>{privacy} <span>⌄</span></button>{privacyOpen && <div className="privacy-menu">{privacyOptions.map(p => <button key={p} onClick={() => {setPrivacy(p);setPrivacyOpen(false)}}><Icon name={p==='Public'?'globe':'lock'} size={13}/>{p}{privacy===p&&<Icon name="check" size={13}/>}</button>)}</div>}</div>
    {type==='mixtape'&&<input className="mixtape-title-input" value={mixtapeTitle} maxLength={70} onChange={event=>setMixtapeTitle(event.target.value)} placeholder="Name this mixtape..."/>}
    {type !== 'text' && <button className={`media-preview ${type} arrangement-${arrangement} ${(type==='moodboard'||type==='mixtape')&&!selected.length?'empty-media-preview':''}`} onClick={() => type==='music'?setPicker('music'):openMediaPicker()}>{type === 'music' ? <img src={images.stilllife}/> : selected.map((im,i)=><img src={im} key={`${im.slice(-10)}-${i}`}/>)}<div><Icon name={type === 'music' ? 'music' : selected.length ? 'sparkle' : 'plus'} /><span>{type === 'music' ? `${song.title} — change song` : type==='mixtape'?(selected.length?'change cover photograph':'add cover photograph'):selected.length ? `${selected.length} photograph${selected.length===1?'':'s'} · tap to change` : 'Add photographs'}</span></div></button>}
    {type === 'moodboard' && <div className="arrangement-picker">{(['editorial','grid','stack'] as const).map(a=><button className={arrangement===a?'active':''} onClick={()=>setArrangement(a)} key={a}>{a}</button>)}</div>}
    <textarea value={caption} onChange={e => setCaption(e.target.value)} maxLength={240} placeholder={type === 'text' ? 'Let the thought wander...' : type==='mixtape'?'A note about this collection (optional)...':'Say something, or leave it quiet...'} /><div className="composer-tools">{type==='mixtape'?<span>{tracks.length}/20 tracks</span>:<button onClick={() => setCaption(c=>`${c}${c?' ':''}#personal`)}># add tags</button>}<span>{caption.length}/240</span></div></section>
    {type==='mixtape'&&<section className="track-editor"><div className="track-editor-heading"><div><span>TRACKLIST</span><strong>{tracks.length} / 20</strong></div><small>Add real song details. Playback is not simulated.</small></div>{tracks.length>0&&<ol className="track-draft-list">{tracks.map((track,index)=><li key={track.id}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{track.title}</strong><small>{track.artist}{track.url?' · linked':''}</small></div><div className="track-draft-actions"><button disabled={index===0} onClick={()=>moveTrack(index,-1)} aria-label="Move track up"><Icon name="arrow" size={14}/></button><button disabled={index===tracks.length-1} onClick={()=>moveTrack(index,1)} aria-label="Move track down"><Icon name="arrow" size={14}/></button><button onClick={()=>setTracks(current=>current.filter(item=>item.id!==track.id))} aria-label="Remove track"><Icon name="trash" size={14}/></button></div></li>)}</ol>}<div className="track-form"><input value={trackDraft.title} onChange={event=>setTrackDraft(current=>({...current,title:event.target.value}))} placeholder="Song title"/><input value={trackDraft.artist} onChange={event=>setTrackDraft(current=>({...current,artist:event.target.value}))} placeholder="Artist"/><input value={trackDraft.url} onChange={event=>setTrackDraft(current=>({...current,url:event.target.value}))} placeholder="Spotify or Apple Music link (optional)"/><button disabled={tracks.length>=20} onClick={addTrack}><Icon name="plus" size={16}/>Add track</button></div>{trackError&&<p className="picker-error" role="alert">{trackError}</p>}</section>}
    {publishError&&<div className="publish-error" role="alert">{publishError}</div>}<button className="publish-button" disabled={publishing} onClick={publish}><span>{publishing?'Publishing safely…':type==='mixtape'?'Publish mixtape':'Publish after dark'}</span>{publishing?<i className="publish-spinner"/>:<Icon name="arrow" />}</button><p className="philosophy">No metrics. No pressure. Just make something yours.</p>
    {picker === 'media' && <Sheet title={type === 'moodboard' ? 'Add photographs' : type==='mixtape'?'Choose a cover photograph':'Choose a photograph'} onClose={()=>{setPendingSelected([]);setPicker(null)}}><div className="picker-summary"><strong>{pendingSelected.length} of {type==='moodboard'?6:1} selected</strong><span>{type==='moodboard'?'Choose up to six photographs':type==='mixtape'?'Choose one atmospheric cover':'Choose one photograph'}</span></div>{pendingSelected.length>0&&<div className="pending-photos"><span>YOUR SELECTION</span><div>{pendingSelected.map((photo,index)=><button key={`${photo}-${index}`} onClick={()=>setPendingSelected(previous=>previous.filter((_,photoIndex)=>photoIndex!==index))} aria-label={`Remove selected photograph ${index+1}`}><img src={photo}/><b><Icon name="close" size={11}/></b></button>)}</div></div>}<p className="library-label">AFTERHOURS LIBRARY</p><div className="media-library">{media.map(im => <button className={pendingSelected.includes(im)?'selected':''} key={im} onClick={() => setPendingSelected(previous=>type==='moodboard'?(previous.includes(im)?previous.filter(x=>x!==im):previous.length<6?[...previous,im]:previous):[im])}><img src={im}/><span><Icon name="check" size={14}/></span></button>)}</div><input ref={inputRef} hidden type="file" accept="image/*" multiple={type==='moodboard'} onChange={e=>readUploads(e.target.files)}/><button className="sheet-action" onClick={()=>inputRef.current?.click()}><Icon name="upload"/> Upload {type==='mixtape'?'cover':'photographs'} from device</button>{uploadError&&<p className="picker-error" role="alert">{uploadError}</p>}<button className="sheet-primary confirm-photos" disabled={!pendingSelected.length} onClick={()=>{setSelected([...pendingSelected]);setPicker(null)}}>Done · Use {pendingSelected.length} Photo{pendingSelected.length===1?'':'s'}</button></Sheet>}
    {picker === 'music' && <Sheet title="Add a song" onClose={()=>setPicker(null)}><p className="simulated-label">SIMULATED 30-SECOND PREVIEWS</p><div className="song-library">{musicLibrary.map(s=><button className={song.title===s.title?'selected':''} onClick={()=>setSong(s)} key={s.title}><span><Icon name="music"/></span><div><strong>{s.title}</strong><small>{s.artist}</small></div>{song.title===s.title&&<Icon name="check"/>}</button>)}</div><button className="sheet-primary" onClick={()=>setPicker(null)}>Add selected song</button></Sheet>}
  </div>
}

function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(24)
  useEffect(() => { if (!playing) return; const timer = window.setInterval(() => setProgress(p => p >= 100 ? 0 : p + 1), 300); return () => clearInterval(timer) }, [playing])
  return <div className={`favorite-song ${playing?'playing':''}`}><button onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause simulated preview':'Play simulated preview'}><Icon name={playing?'pause':'play'} filled={!playing} size={14}/></button><div><span>SIMULATED PREVIEW · ON REPEAT</span><strong>Myth — Beach House</strong><div className="song-progress"><i style={{width:`${progress}%`}}/></div></div><small>{Math.floor(progress*.3).toString().padStart(2,'0')}s</small></div>
}

function MoodboardThumbnail({ post }: { post: Post }) {
  const photographs=post.images?.length?post.images:post.image?[post.image]:[]
  const layout=post.moodboardLayout||'editorial'
  return <div className={`archive-moodboard-thumbnail archive-thumbnail-${layout}`} data-count={photographs.length}>
    {photographs.map((photograph,index)=><img key={`${photograph}-${index}`} src={photograph} alt=""/> )}
  </div>
}

function isLightSurface(color: string) {
  const hex = color.replace('#','')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return false
  const [red,green,blue] = [0,2,4].map(offset => parseInt(hex.slice(offset,offset+2),16))
  return (red*299+green*587+blue*114)/1000 > 165
}

function Profile({ customization, archiveLayout, goCustomize, archive, userInfo, setUserInfo, goSettings, goSaved, notify, onOpen }: any) {
  const [tab, setTab] = useState<'archive'|'about'|'ask'>('archive')
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [question, setQuestion] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [inbox, setInbox] = useStored<any[]>('afterhours-inbox', [{id:1,from:'anonymous',question:'what song feels most like home?',answered:false}])
  const submit = () => { if (!question.trim()) return; setInbox([...inbox,{id:Date.now(),from:anonymous?'anonymous':'@lunaoffline',question,answered:false}]);setQuestion('');notify('Question delivered to your simulated inbox') }
  const lightProfile=isLightSurface(customization.background)
  const style = {
    '--profile-accent':customization.color,
    '--profile-font':customization.font,
    '--profile-bg':customization.background,
    '--profile-text':lightProfile?'#29252c':'#ece9ef',
    '--profile-muted':lightProfile?'#59535d':'#bbb6be',
    '--profile-subtle':lightProfile?'#625b66':'#918a96',
    '--profile-card':lightProfile?'#ddd6d1':'#141318',
    '--profile-card-text':lightProfile?'#302b33':'#ece8ee',
    '--profile-card-meta':lightProfile?'#675873':'#a99abd',
  } as React.CSSProperties
  return <div className={`screen profile-screen layout-${archiveLayout} style-${customization.style} ${lightProfile?'profile-background-light':'profile-background-dark'}`} data-archive-layout={archiveLayout} style={style}><div className="profile-cover"><img src={images.city}/><div className="profile-cover-actions"><button className="icon-button" onClick={goSaved}><Icon name="bookmark"/></button><button className="icon-button" onClick={()=>setMenu(!menu)}><Icon name="more"/></button></div>{menu&&<div className="profile-menu"><button onClick={()=>{navigator.clipboard?.writeText('https://afterhours.local/lunaoffline');notify('Profile link copied');setMenu(false)}}><Icon name="share"/>Share Profile</button><button onClick={()=>{navigator.clipboard?.writeText('https://afterhours.local/lunaoffline');notify('Link copied');setMenu(false)}}><Icon name="link"/>Copy Link</button><button onClick={goSettings}><Icon name="settings"/>Settings</button></div>}</div><section className="profile-info"><img className="profile-avatar" src={images.portrait}/><button className="edit-profile" onClick={goCustomize}><Icon name="edit" size={16}/> customize</button><p className="eyebrow">{customization.style==='classic'?'PERSONAL BLOG · SINCE 2014, SOMEHOW':'MODERN ARCHIVE · VOL. 07'}</p><h1>luna, offline</h1><p className="handle">@lunaoffline</p><p className="bio">{userInfo.bio}</p><div className="profile-links"><span>somewhere after midnight</span><i/><span>she / they</span></div><MusicPlayer/></section><div className="profile-tabs"><button className={tab==='archive'?'active':''} onClick={()=>setTab('archive')}>archive</button><button className={tab==='about'?'active':''} onClick={()=>setTab('about')}>about</button><button className={tab==='ask'?'active':''} onClick={()=>setTab('ask')}>ask me</button></div>
    {tab==='archive' && <div className="archive-section">{archive.length ? <div className="profile-grid">{archive.map((post:Post)=><button className={`archive-tile archive-tile-${post.type} ${post.type==='moodboard'?`archive-layout-${post.moodboardLayout||'editorial'}`:''}`} key={post.id} onClick={()=>onOpen(post)} aria-label={`Open ${post.type} post`}><div className="archive-tile-media">{post.reblogOf&&<span className="archive-credit"><Icon name="repeat" size={11}/>{post.reblogOf.handle}</span>}{post.type==='mixtape'?<div className="archive-mixtape-cover"><img src={post.image||images.city} alt=""/><div><span>MIXTAPE · {post.tracks?.length||0}</span><strong>{post.mixtapeTitle}</strong></div></div>:post.type==='moodboard'?<MoodboardThumbnail post={post}/>:post.type==='quote'?<div className="profile-quote archive-text-preview"><span>“</span><p>{post.caption}</p></div>:post.image?<img src={post.image} alt=""/>:<div className="profile-quote">{post.type==='music'?<><Icon name="music"/><em>{post.song?.title||'music post'}</em></>:post.caption}</div>}</div><span className={`archive-journal-caption ${post.type==='mixtape'?'mixtape-caption':''}`}>{post.type==='quote'?'Text post':post.type==='mixtape'?<><strong>{post.mixtapeTitle}</strong><small>{post.caption}</small></>:post.caption}</span></button>)}</div>:<Empty title="Your archive is still quiet" copy="Publish or reblog something and it will live here."/ >}</div>}
    {tab==='about' && <section className="about-panel">{editing ? <><label>Biography<textarea value={userInfo.bio} onChange={e=>setUserInfo({...userInfo,bio:e.target.value})}/></label><label>Interests<input value={userInfo.interests} onChange={e=>setUserInfo({...userInfo,interests:e.target.value})}/></label><label>Favorite artists<input value={userInfo.artists} onChange={e=>setUserInfo({...userInfo,artists:e.target.value})}/></label><label>Personal link<input value={userInfo.link} onChange={e=>setUserInfo({...userInfo,link:e.target.value})}/></label><button className="panel-primary" onClick={()=>{setEditing(false);notify('About page saved')}}>Save changes</button></>:<><AboutRow title="Biography" value={userInfo.bio}/><AboutRow title="Interests" value={userInfo.interests}/><AboutRow title="Favorite artists" value={userInfo.artists}/><AboutRow title="Elsewhere" value={userInfo.link}/><button className="outline-action" onClick={()=>setEditing(true)}><Icon name="edit"/>Edit personal information</button></>}</section>}
    {tab==='ask' && <section className="ask-panel"><div className="ask-box"><span>ASK @LUNAOFFLINE</span><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="leave a question in the dark..."/><div><button onClick={()=>setAnonymous(!anonymous)} className={anonymous?'active':''}>{anonymous?<Icon name="lock"/>:<Icon name="user"/>}{anonymous?'Anonymous':'Identified'}</button><button disabled={!question.trim()} onClick={submit}><Icon name="send"/>Send</button></div></div><div className="inbox-head"><span>SIMULATED INBOX</span><strong>{inbox.length}</strong></div>{inbox.map(q=><div className="question-card" key={q.id}><span>FROM {q.from.toUpperCase()}</span><p>{q.question}</p><button onClick={()=>setInbox(inbox.filter(x=>x.id!==q.id))}>dismiss</button></div>)}</section>}
  </div>
}

function AboutRow({title,value}:{title:string;value:string}) { return <div className="about-row"><span>{title}</span><p>{value}</p></div> }
function Empty({title,copy}:{title:string;copy:string}) { return <div className="empty-state"><Icon name="sparkle" size={27}/><h2>{title}</h2><p>{copy}</p></div> }

function Customize({ draft, setDraft, onSave, onCancel }: any) {
  const colors = ['#9a8db4','#b57b83','#6f8c85','#c19b69','#888d9c']
  const backgrounds = [
    {name:'Obsidian',value:'#111014'},
    {name:'Midnight Violet',value:'#27212F'},
    {name:'Forest After Dark',value:'#182725'},
    {name:'Espresso',value:'#302521'},
    {name:'Warm Ivory',value:'#E8E1D7'},
  ]
  const presets = [{name:'Violet Static',color:'#9a8db4',background:'#27212F'},{name:'Dried Rose',color:'#b57b83',background:'#302521'},{name:'Silver Screen',color:'#888d9c',background:'#111014'}]
  const draftIsLight=isLightSurface(draft.background)
  const previewStyle={
    '--profile-accent':draft.color,
    '--profile-font':draft.font,
    '--profile-bg':draft.background,
    '--profile-text':draftIsLight?'#29252c':'#ece9ef',
    '--profile-muted':draftIsLight?'#59535d':'#bbb6be',
  } as React.CSSProperties
  const saveAndDone=()=>onSave(draft)
  return <div className="screen customize-screen"><Header title="Make it yours" subtitle="your space, your rules" back onBack={onCancel} action={<button className="done-text" onClick={saveAndDone}>Done</button>}/><div className="live-label"><span>LIVE PREVIEW</span><i/></div><div className={`mini-profile layout-${draft.layout} style-${draft.style}`} style={previewStyle}><img src={images.city}/><div className="mini-body"><img src={images.portrait}/><span>@lunaoffline</span><h2>luna, offline</h2><p>collecting the parts of the night that disappear by morning.</p><b>your blog</b></div><div className={`mini-archive mini-archive-${draft.layout}`} aria-hidden="true"><i/><i/><i/><i/></div></div>
    <Control title="Theme presets" subtitle="Start with a distinct atmosphere"><div className="preset-options">{presets.map(p=><button key={p.name} onClick={()=>setDraft((current:any)=>({...current,color:p.color,background:p.background}))}><i style={{background:`linear-gradient(135deg,${p.background} 55%,${p.color} 55%)`}}/><span>{p.name}</span></button>)}</div></Control>
    <Control title="Atmosphere" subtitle="Choose your signature color"><div className="swatches">{colors.map(c=><button key={c} onClick={()=>setDraft((current:any)=>({...current,color:c}))} className={draft.color===c?'active':''} style={{background:c}}/>)}</div></Control>
    <Control title="Background" subtitle="Behind your personal archive"><div className="swatches">{backgrounds.map(background=><button aria-label={background.name} key={background.value} onClick={()=>setDraft((current:any)=>({...current,background:background.value}))} className={draft.background.toLowerCase()===background.value.toLowerCase()?'active':''} style={{background:background.value}}/>)}</div></Control>
    <Control title="Voice" subtitle="How your words feel"><div className="font-options">{['editorial','modern','mono'].map(f=><button key={f} onClick={()=>setDraft((current:any)=>({...current,font:f}))} className={`${f} ${draft.font===f?'active':''}`}><strong>Aa</strong><span>{f}</span></button>)}</div></Control>
    <Control title="Layout" subtitle="Arrange your archive"><div className="layout-options">{(['grid','journal','collage'] as ArchiveLayout[]).map(layout=><button key={layout} onClick={()=>setDraft((current:any)=>({...current,layout}))} className={draft.layout===layout?'active':''}><i className={layout}/><span>{layout}</span></button>)}</div></Control>
    <Control title="Profile style" subtitle="Choose the shape of your corner"><div className="style-options">{[{key:'classic',title:'Classic Blog',copy:'layered, personal, nostalgic'},{key:'modern',title:'Modern Archive',copy:'clean, spacious, curated'}].map(s=><button key={s.key} className={draft.style===s.key?'active':''} onClick={()=>setDraft((current:any)=>({...current,style:s.key}))}><strong>{s.title}</strong><span>{s.copy}</span>{draft.style===s.key&&<Icon name="check"/>}</button>)}</div></Control>
  </div>
}
function Control({title,subtitle,children}:any){return <section className="control-section"><div className="control-title"><div><strong>{title}</strong><span>{subtitle}</span></div></div>{children}</section>}

function Settings({ appearance, setAppearance, back, notify }: any) {
  const [prefs,setPrefs]=useStored('afterhours-preferences',{gentleMotion:true,quietMetrics:true})
  return <div className="screen settings-screen"><Header title="Settings" subtitle="make the app feel like yours" back onBack={back}/><section className="settings-group"><span>APPEARANCE</span>{[{key:'dark',title:'Dark',copy:'the original afterhours'},{key:'light',title:'Light',copy:'warm ivory and soft silver'},{key:'system',title:'System',copy:'match this device'}].map(o=><button className={appearance===o.key?'active':''} key={o.key} onClick={()=>{setAppearance(o.key);notify(`${o.title} appearance applied`)}}><i className={`theme-preview ${o.key}`}/><div><strong>{o.title}</strong><span>{o.copy}</span></div>{appearance===o.key&&<Icon name="check"/>}</button>)}</section><section className="settings-group"><span>YOUR SPACE</span><button onClick={()=>setPrefs({...prefs,gentleMotion:!prefs.gentleMotion})}><Icon name="sparkle"/><div><strong>Gentle motion</strong><span>subtle transitions and ambient details</span></div><b>{prefs.gentleMotion?'On':'Off'}</b></button><button onClick={()=>setPrefs({...prefs,quietMetrics:!prefs.quietMetrics})}><Icon name="heart"/><div><strong>Quiet metrics</strong><span>keep follower counts out of sight</span></div><b>{prefs.quietMetrics?'On':'Off'}</b></button></section><div className="settings-note"><Logo/><p>AFTERHOURS is designed around self-expression, not performance.</p><small>PROTOTYPE BUILD 02.17</small></div></div>
}

function SavedPosts({ posts, saved, back, onOpen, scrapbooks, addToScrap, notify }: any) {
  const [adding, setAdding] = useState<Post|null>(null)
  const list = posts.filter((p:Post)=>saved.includes(p.id))
  return <div className="screen saved-screen"><Header title="Saved Posts" subtitle={`${list.length} fragments kept`} back onBack={back}/>{list.length?<div className="saved-list">{list.map((p:Post)=><div className="saved-card" key={p.id}><button onClick={()=>onOpen(p)}>{p.image?<img src={p.image}/>:<div>“{p.caption}”</div>}<span>{p.type==='mixtape'?'SAVED MIXTAPE':p.handle}</span><p>{p.type==='mixtape'?p.mixtapeTitle:p.caption}</p></button><button onClick={()=>setAdding(p)}><Icon name="plus"/>Add to Scraps</button></div>)}</div>:<Empty title="Nothing saved yet" copy="Bookmark posts from Home and they will wait here."/>}{adding&&<Sheet title="Add to a scrapbook" onClose={()=>setAdding(null)}>{scrapbooks.length?scrapbooks.map((b:Scrapbook)=><button className="sheet-row" key={b.id} onClick={()=>{addToScrap(b.id,adding);setAdding(null);notify(`Added to “${b.title}”`)}}><img src={b.cover}/><div><strong>{b.title}</strong><span>{b.fragments.length} fragments</span></div><Icon name="plus"/></button>):<p className="no-results">Create a scrapbook first.</p>}</Sheet>}</div>
}

function Scrapbooks({ books, setBooks, savedPosts, notify }: any) {
  const [open, setOpen] = useState<Scrapbook|null>(null)
  const [dialog, setDialog] = useState<'new'|'fragment'|'menu'|null>(null)
  const [name, setName] = useState('')
  const [fragmentType, setFragmentType] = useState<'photo'|'quote'|'music'|'saved'>('photo')
  const [value, setValue] = useState('')
  const active = open ? books.find((b:Scrapbook)=>b.id===open.id) : null
  const update = (fn:(b:Scrapbook)=>Scrapbook) => setBooks((all:Scrapbook[])=>all.map(b=>b.id===active?.id?fn(b):b))
  const create = () => { if(!name.trim())return; const b={id:Date.now(),title:name.trim(),privacy:'Private' as const,fragments:[],cover:images.stilllife};setBooks([...books,b]);setName('');setDialog(null);setOpen(b) }
  const addFragment = (fragment?:Fragment) => { const f=fragment||{id:Date.now(),type:fragmentType,value:value||({photo:'a photograph from tonight',quote:'keep some room for the unimaginable.',music:'Myth — Beach House',saved:'saved post'} as any)[fragmentType],image:fragmentType==='photo'?images.city:undefined};update(b=>({...b,fragments:[...b.fragments,f]}));setValue('');setDialog(null);notify('Fragment added') }
  if(active) return <div className="screen book-detail"><Header title={active.title} subtitle={`${active.fragments.length} fragments · ${active.privacy}`} back onBack={()=>setOpen(null)} action={<button className="icon-button" onClick={()=>setDialog('menu')}><Icon name="more"/></button>}/>{active.fragments.length?<div className="scrap-canvas dynamic">{active.fragments.map((f:Fragment,i:number)=><div className={`dynamic-fragment type-${f.type} pos-${i%6}`} key={f.id}>{f.type==='photo'&&<img src={f.image||images.city}/>} {f.type==='quote'&&<p>“{f.value}”</p>}{f.type==='music'&&<><Icon name="music"/><span>{f.value}<small>SIMULATED MUSIC CARD</small></span></>}{f.type==='saved'&&<><Icon name="bookmark"/><span>{f.value}</span></>}<button onClick={()=>update(b=>({...b,fragments:b.fragments.filter(x=>x.id!==f.id)}))}><Icon name="close" size={12}/></button></div>)}</div>:<Empty title="An empty page" copy="Add the first fragment and let this little world begin."/>}<button className="floating-add" onClick={()=>setDialog('fragment')}><Icon name="plus"/>Add Fragment</button>
    {dialog==='fragment'&&<Sheet title="Add a fragment" onClose={()=>setDialog(null)}><div className="fragment-types">{(['photo','quote','music','saved'] as const).map(t=><button className={fragmentType===t?'active':''} onClick={()=>setFragmentType(t)} key={t}><Icon name={t==='photo'?'camera':t==='quote'?'type':t==='music'?'music':'bookmark'}/>{t}</button>)}</div>{fragmentType==='saved'?<div>{savedPosts.length?savedPosts.map((p:Post)=><button className="sheet-row" key={p.id} onClick={()=>addFragment({id:Date.now(),type:'saved',value:`${p.caption} — ${p.handle}`,image:p.image})}><img src={p.image||p.avatar}/><div><strong>{p.caption}</strong><span>{p.handle}</span></div></button>):<p className="no-results">Save a post first, then bring it here.</p>}</div>:<><label className="sheet-input">{fragmentType==='photo'?'Caption':fragmentType==='quote'?'Quote':'Song card'}<input value={value} onChange={e=>setValue(e.target.value)} placeholder={fragmentType==='music'?'Song — Artist':'write something...'}/></label><button className="sheet-primary" onClick={()=>addFragment()}>Add to scrapbook</button></>}</Sheet>}
    {dialog==='menu'&&<Sheet title="Scrapbook options" onClose={()=>setDialog(null)}><button className="sheet-menu-button" onClick={()=>{const n=prompt('Rename scrapbook',active.title);if(n?.trim())update(b=>({...b,title:n.trim()}));setDialog(null)}}><Icon name="edit"/>Rename</button><button className="sheet-menu-button" onClick={()=>{setDialog('fragment')}}><Icon name="plus"/>Edit fragments</button><button className="sheet-menu-button" onClick={()=>{update(b=>({...b,privacy:b.privacy==='Private'?'Public':'Private'}));setDialog(null)}}><Icon name={active.privacy==='Private'?'globe':'lock'}/>Make {active.privacy==='Private'?'Public':'Private'}</button><button className="sheet-menu-button danger" onClick={()=>{setBooks(books.filter((b:Scrapbook)=>b.id!==active.id));setOpen(null);setDialog(null)}}><Icon name="trash"/>Delete scrapbook</button></Sheet>}</div>
  return <div className="screen scrapbooks-screen"><Header title="Scrapbooks" subtitle="little worlds you keep" action={<button className="icon-button" onClick={()=>setDialog('new')}><Icon name="plus"/></button>}/><div className="scrap-intro"><p>Not everything needs to be shared.<br/><em>Some things are just for you.</em></p><span>{books.reduce((n:number,b:Scrapbook)=>n+b.fragments.length,0)} fragments collected</span></div>{books.length?<div className="book-list">{books.map((b:Scrapbook,i:number)=><button className={`book-card ${i%2?'silver':'violet'}`} onClick={()=>setOpen(b)} key={b.id}><div className="book-cover"><img src={b.cover}/>{b.fragments[0]?.image&&<img src={b.fragments[0].image}/>}<div className="book-number">0{i+1}</div></div><div className="book-info"><span>{b.privacy.toUpperCase()} SCRAPBOOK</span><h2>{b.title}</h2><p>{b.fragments.length} fragments</p></div><Icon name="arrow"/></button>)}</div>:<Empty title="No scrapbooks yet" copy="Start an empty collection and fill it at your own pace."/>}<button className="new-book" onClick={()=>setDialog('new')}><Icon name="plus"/><span><strong>start a new scrapbook</strong><small>make a little world</small></span></button>{dialog==='new'&&<Sheet title="Name your new scrapbook" onClose={()=>setDialog(null)}><label className="sheet-input">TITLE<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="things I almost forgot"/></label><p className="simulated-label">New scrapbooks begin completely empty and private.</p><button disabled={!name.trim()} className="sheet-primary" onClick={create}>Create empty scrapbook</button></Sheet>}</div>
}

function Navigation({ active, setScreen }: { active: Screen; setScreen: (s: Screen) => void }) {
  const items:{screen:Screen;icon:IconName;label:string}[]=[{screen:'home',icon:'home',label:'Home'},{screen:'explore',icon:'compass',label:'Explore'},{screen:'create',icon:'plus',label:'Create'},{screen:'scrapbooks',icon:'grid',label:'Scraps'},{screen:'profile',icon:'user',label:'Me'}]
  return <nav className="bottom-nav">{items.map(i=><button key={i.screen} className={`${active===i.screen?'active':''} ${i.screen==='create'?'create-nav':''}`} onClick={()=>setScreen(i.screen)}><span><Icon name={i.icon} filled={active===i.screen&&i.screen!=='create'}/></span><small>{i.label}</small></button>)}</nav>
}

function MixtapeViewer({ mixtape, onClose, liked, saved, onLike, onSave, onReblog }: { mixtape: Post; onClose:()=>void; liked:boolean; saved:boolean; onLike:()=>void; onSave:()=>void; onReblog:()=>void }) {
  return <div className="mixtape-viewer">
    <div className="mixtape-viewer-scroll">
      <section className="mixtape-hero"><img src={mixtape.image||images.city} alt=""/><div className="featured-shade"/><button className="icon-button mixtape-close" onClick={onClose} aria-label="Close mixtape"><Icon name="close"/></button><div className="mixtape-hero-copy"><span>{mixtape.curated?'AFTERHOURS EDITORIAL':'PERSONAL MIXTAPE'} · {mixtape.tracks?.length||0} TRACKS</span><h1>{mixtape.mixtapeTitle||'untitled mixtape'}</h1><p>{mixtape.caption}</p></div></section>
      <div className="mixtape-intro"><div><span>CURATED BY</span><strong>{mixtape.handle}</strong></div><button className={saved?'saved':''} onClick={onSave}><Icon name="bookmark" filled={saved}/>{saved?'Collection saved':'Save collection'}</button></div>
      <ol className="mixtape-tracklist">{mixtape.tracks?.map((track,index)=><li key={track.id}><span className="track-number">{String(index+1).padStart(2,'0')}</span>{track.artwork?<img src={track.artwork} alt=""/>:<div className="track-art-fallback"><Icon name="music" size={16}/></div>}<div><strong>{track.title}</strong><span>{track.artist}</span></div>{track.url?<a href={track.url} target="_blank" rel="noreferrer" aria-label={`Open ${track.title} by ${track.artist} on music service`}><Icon name="link" size={15}/><small>Spotify</small></a>:<small className="no-track-link">no link</small>}</li>)}</ol>
      <p className="mixtape-disclaimer">External links open the selected music service. AFTERHOURS does not simulate or host audio playback.</p>
      <div className="modal-actions mixtape-actions"><button aria-pressed={liked} className={liked?'active':''} onClick={onLike}><Icon name="heart" filled={liked}/>like</button><button onClick={onReblog}><Icon name="repeat"/>reblog</button><button aria-pressed={saved} className={saved?'active':''} onClick={onSave}><Icon name="bookmark" filled={saved}/>save</button></div>
    </div>
  </div>
}

function PhotoViewer({ photographs, initialIndex, onClose }: { photographs: string[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex)
  const gesture = useRef<{x:number;y:number}|null>(null)
  const move = (direction: number) => setIndex(current => (current + direction + photographs.length) % photographs.length)
  useEffect(()=>{
    const handleKey=(event:KeyboardEvent)=>{
      if(event.key==='ArrowLeft') move(-1)
      if(event.key==='ArrowRight') move(1)
      if(event.key==='Escape') onClose()
    }
    window.addEventListener('keydown',handleKey)
    return()=>window.removeEventListener('keydown',handleKey)
  },[photographs.length,onClose])
  const startGesture=(event:React.PointerEvent)=>{
    gesture.current={x:event.clientX,y:event.clientY}
    try { event.currentTarget.setPointerCapture?.(event.pointerId) } catch { /* The gesture still works without pointer capture. */ }
  }
  const finishGesture=(event:React.PointerEvent)=>{
    if(!gesture.current)return
    const horizontal=event.clientX-gesture.current.x
    const vertical=event.clientY-gesture.current.y
    gesture.current=null
    if(Math.abs(horizontal)>45&&Math.abs(horizontal)>Math.abs(vertical)*1.15)move(horizontal<0?1:-1)
  }
  return <div className="photo-viewer" onClick={onClose} onPointerDown={startGesture} onPointerUp={finishGesture} onPointerCancel={()=>{gesture.current=null}}>
    <div className="photo-viewer-top"><span>{index + 1} / {photographs.length}</span><button onClick={onClose} aria-label="Close full screen photograph"><Icon name="close"/></button></div>
    <img key={index} onClick={event => event.stopPropagation()} src={photographs[index]} alt={`Full screen moodboard photograph ${index + 1} of ${photographs.length}`}/>
    {photographs.length > 1 && <div className="photo-viewer-nav"><button onClick={event => {event.stopPropagation();move(-1)}} aria-label="Previous photograph"><Icon name="arrow"/></button><button onClick={event => {event.stopPropagation();move(1)}} aria-label="Next photograph"><Icon name="arrow"/></button></div>}
  </div>
}

function App() {
  const [screen,setScreen]=useState<Screen>('home')
  const [posts,setPosts]=useStored<Post[]>('afterhours-posts',initialPosts)
  const [liked,setLiked]=useStored<number[]>('afterhours-liked',[])
  const [saved,setSaved]=useStored<number[]>('afterhours-saved',[3])
  const [appearance,setAppearance]=useStored<'dark'|'light'|'system'>('afterhours-appearance','dark')
  const [storedCustomization,setStoredCustomization]=useStored<any>('afterhours-profile-theme',defaultProfileCustomization)
  const customization=useMemo(()=>normalizeProfileCustomization(storedCustomization),[storedCustomization])
  const archiveLayout=customization.layout
  const [customizationDraft,setCustomizationDraft]=useState(()=>customization)
  const openCustomize=()=>{
    setCustomizationDraft(customization)
    setScreen('customize')
  }
  const saveCustomization=(next:any)=>{
    const normalized=normalizeProfileCustomization(next)
    try { localStorage.setItem('afterhours-profile-theme',JSON.stringify(normalized)) } catch (error) { console.error('AFTERHOURS could not save profile customization',error) }
    setStoredCustomization(normalized)
    setScreen('profile')
  }
  const [userInfo,setUserInfo]=useStored('afterhours-about',{bio:'collecting the parts of the night that disappear by morning. photographer, chronic overthinker, occasional poet.',interests:'35mm film, dream pop, night buses, old web design',artists:'Beach House, Slowdive, Mazzy Star, Cocteau Twins',link:'lunaoffline.neocities.org'})
  const [books,setBooks]=useStored<Scrapbook[]>('afterhours-scrapbooks',[{id:1,title:'things that feel like 2am',privacy:'Private',cover:images.city,fragments:[{id:11,type:'photo',value:'rain on the window',image:images.city},{id:12,type:'quote',value:'keep some room in your heart for the unimaginable.'},{id:13,type:'music',value:'Myth — Beach House'}]},{id:2,title:'future nostalgia',privacy:'Public',cover:images.stilllife,fragments:[{id:21,type:'photo',value:'analog rituals',image:images.stilllife}]}])
  const [opened,setOpened]=useState<Post|null>(null)
  const [photoViewer,setPhotoViewer]=useState<{photographs:string[];index:number}|null>(null)
  const [postMenu,setPostMenu]=useState<Post|null>(null)
  const [toast,setToast]=useState('')
  const [systemDark,setSystemDark]=useState(()=>matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(()=>{const m=matchMedia('(prefers-color-scheme: dark)');const fn=()=>setSystemDark(m.matches);m.addEventListener('change',fn);return()=>m.removeEventListener('change',fn)},[])
  const resolvedTheme=appearance==='system'?(systemDark?'dark':'light'):appearance
  useEffect(()=>{document.documentElement.dataset.theme=resolvedTheme},[resolvedTheme])
  const toggle=(setter:any,list:number[],id:number)=>setter(list.includes(id)?list.filter(x=>x!==id):[...list,id])
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),1900)}
  const reblog=(post:Post)=>{if(post.owner||post.reblogOf){notify('This post is already in your archive');return}const copy:{[K in keyof Post]:Post[K]}={...post,id:Date.now(),user:'luna, offline',handle:'@lunaoffline',avatar:images.portrait,time:'now',notes:0,owner:true,reblogOf:{user:post.user,handle:post.handle,id:post.id}};setPosts([copy,...posts]);notify(`Reblogged with credit to ${post.handle}`)}
  const publish=async(post:Post)=>{
    const nextPosts=[post,...posts]
    try {
      localStorage.setItem('afterhours-posts',JSON.stringify(nextPosts))
    } catch (error) {
      const storageFull=error instanceof DOMException&&(error.name==='QuotaExceededError'||error.name==='NS_ERROR_DOM_QUOTA_REACHED')
      throw new Error(storageFull?'These photographs are still too large for browser storage. Your draft is safe—try fewer or smaller files.':'AFTERHOURS could not safely store this post. Your draft has been preserved.')
    }
    setPosts(nextPosts)
    setScreen('home')
    notify(`${post.visibility} post published to your feed`)
  }
  const archive=useMemo(()=>posts.filter(p=>p.owner||p.reblogOf),[posts])
  const saveablePosts=[purpleMixtape,...posts]
  const savedPosts=saveablePosts.filter(p=>saved.includes(p.id))
  const addToScrap=(bookId:number,post:Post)=>setBooks(books.map(b=>b.id===bookId?{...b,fragments:[...b.fragments,{id:Date.now(),type:'saved',value:`${post.mixtapeTitle||post.caption} — ${post.handle}`,image:post.image}]}:b))
  const openPhoto=(photographs:string[],index:number)=>setPhotoViewer({photographs,index})
  const postProps={posts,liked,saved,onLike:(id:number)=>toggle(setLiked,liked,id),onSave:(id:number)=>{toggle(setSaved,saved,id);notify(saved.includes(id)?'Removed from Saved Posts':'Saved — add it to a Scrap anytime')},onReblog:reblog,onOpen:setOpened,onMore:setPostMenu,onPhoto:openPhoto}
  const visibleNav=!['customize','settings','saved'].includes(screen)
  return <div className="app-stage" data-theme={resolvedTheme} style={{'--active-accent':customization.color} as React.CSSProperties}><aside className="desktop-rail"><Logo/><p>your corner of<br/>the internet.</p><div className="rail-line"/><span>02:17<br/>somewhere</span></aside><main className="phone-shell"><div className="screen-content">
    {screen==='home'&&<Home {...postProps} onSearch={()=>setScreen('explore')}/>}
    {screen==='explore'&&<Explore posts={posts} onOpen={setOpened}/>}
    {screen==='create'&&<Create onPublish={publish}/>}
    {screen==='profile'&&<Profile customization={customization} archiveLayout={archiveLayout} goCustomize={openCustomize} archive={archive} userInfo={userInfo} setUserInfo={setUserInfo} goSettings={()=>setScreen('settings')} goSaved={()=>setScreen('saved')} notify={notify} onOpen={setOpened}/>}
    {screen==='customize'&&<Customize draft={customizationDraft} setDraft={setCustomizationDraft} onSave={saveCustomization} onCancel={()=>setScreen('profile')}/>}
    {screen==='settings'&&<Settings appearance={appearance} setAppearance={setAppearance} back={()=>setScreen('profile')} notify={notify}/>}
    {screen==='saved'&&<SavedPosts posts={saveablePosts} saved={saved} back={()=>setScreen('profile')} onOpen={setOpened} scrapbooks={books} addToScrap={addToScrap} notify={notify}/>}
    {screen==='scrapbooks'&&<Scrapbooks books={books} setBooks={setBooks} savedPosts={savedPosts} notify={notify}/>}
  </div>{visibleNav&&<Navigation active={screen} setScreen={setScreen}/>}
  {opened?.type==='mixtape'&&<MixtapeViewer mixtape={opened} onClose={()=>setOpened(null)} liked={liked.includes(opened.id)} saved={saved.includes(opened.id)} onLike={()=>toggle(setLiked,liked,opened.id)} onSave={()=>toggle(setSaved,saved,opened.id)} onReblog={()=>reblog(opened)}/>}
  {opened&&opened.type!=='mixtape'&&<div className="post-modal" onClick={()=>setOpened(null)}><div onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setOpened(null)}><Icon name="close"/></button>{opened.type==='moodboard'?<MoodboardGallery post={opened} context="modal" onPhoto={openPhoto}/>:opened.type!=='quote'&&opened.image&&<img className="single-post-image" src={opened.image}/>}<span>{opened.reblogOf?`REBLOGGED FROM ${opened.reblogOf.handle}`:opened.handle}</span>{opened.type==='quote'?<div className="modal-text-post"><span>“</span><p>{opened.caption}</p></div>:<h2>{opened.caption}</h2>}<p>{opened.notes} quiet notes · {opened.visibility||'Public'}{opened.type==='moodboard'?` · ${opened.images?.length||1} photographs · ${opened.moodboardLayout||'editorial'}`:''}</p><div className="modal-actions"><button aria-pressed={liked.includes(opened.id)} onClick={()=>toggle(setLiked,liked,opened.id)} className={liked.includes(opened.id)?'active':''}><Icon name="heart" filled={liked.includes(opened.id)}/>like</button><button onClick={()=>reblog(opened)}><Icon name="repeat"/>reblog</button><button aria-pressed={saved.includes(opened.id)} className={saved.includes(opened.id)?'active':''} onClick={()=>toggle(setSaved,saved,opened.id)}><Icon name="bookmark" filled={saved.includes(opened.id)}/>save</button></div></div></div>}
  {photoViewer&&<PhotoViewer photographs={photoViewer.photographs} initialIndex={photoViewer.index} onClose={()=>setPhotoViewer(null)}/>}
  {postMenu&&<Sheet title="Post options" onClose={()=>setPostMenu(null)}><button className="sheet-menu-button" onClick={()=>{navigator.clipboard?.writeText(`https://afterhours.local/post/${postMenu.id}`);notify('Post link copied');setPostMenu(null)}}><Icon name="link"/>Copy post link</button><button className="sheet-menu-button" onClick={()=>{toggle(setSaved,saved,postMenu.id);setPostMenu(null)}}><Icon name="bookmark"/>{saved.includes(postMenu.id)?'Remove from saved':'Save for later'}</button></Sheet>}
  {toast&&<div className="toast"><Icon name="sparkle" size={16}/>{toast}</div>}</main><aside className="desktop-note"><span>NO FOLLOWER COUNTS</span><span>NO PERFORMANCE</span><span>JUST EXPRESSION</span></aside></div>
}

export default App
