import qrcode from 'qrcode'
import React from 'react'

/**
 * @param {React.PropsWithoutRef<React.ImgHTMLAttributes<{}> & { value: string }>} param0
 * @returns
 */
export default function QRCode ({ value, ...props }) {
  const [data, setData] = React.useState('')
  React.useEffect(() => {
    qrcode.toDataURL(value).then(setData).catch(error => {
      console.error(error)
    })
  }, [value])
  return <img src={data} alt={value} {...props} />
}
