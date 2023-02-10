import ReactDOMServer from 'react-dom/server'

export const altAsSvg = (str: string| undefined) => {
  const svg = (
     <svg height="35" width="40" viewBox="0 0 35 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontWeight="600" fontSize="larger" fontFamily="Nunito, sans-serif" fill="white">{str}</text>
    </svg>
  )
  return "data:image/svg+xml," + encodeURIComponent(ReactDOMServer.renderToString(svg))
}
