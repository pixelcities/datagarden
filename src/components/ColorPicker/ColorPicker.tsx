import React, { FC, useState, useMemo, useCallback } from 'react'

import './ColorPicker.sass'


interface ColorPickerProps {
  color?: string,
  onClick?: (color: string) => void
}

const ColorPicker: FC<ColorPickerProps> = ({ color, onClick }) => {
  const [colorCode, setColorCode] = useState(color || "#E42256")
  const [pickerIsActive, setPickerIsActive] = useState(false)

  const changeColor = useCallback((color: string) => {
    if (onClick) {
      onClick(color)
    }

    setColorCode(color)
    setPickerIsActive(false)
  }, [ onClick, setColorCode, setPickerIsActive ])

  const renderPicker = useMemo(() => {
    if (pickerIsActive) {
      return (
        <div className="picker-container">
          <div className="picker-box">
            <div className="picker-arrow" style={{borderBottomColor: colorCode}}/>

            <div className="picker-preview" style={{backgroundColor: colorCode}}>
              { colorCode }
            </div>

            <div className="picker-content">
              <div className="picker-colors">
                <div className="picker-color" style={{backgroundColor: "#FCB5AC"}} onClick={() => changeColor("#FCB5AC")} />
                <div className="picker-color" style={{backgroundColor: "#F39D01"}} onClick={() => changeColor("#F39D01")} />
                <div className="picker-color" style={{backgroundColor: "#FEC84D"}} onClick={() => changeColor("#FEC84D")} />
                <div className="picker-color" style={{backgroundColor: "#E42256"}} onClick={() => changeColor("#E42256")} />
                <div className="picker-color" style={{backgroundColor: "#B99095"}} onClick={() => changeColor("#B99095")} />
                <div className="picker-color" style={{backgroundColor: "#B5E5CF"}} onClick={() => changeColor("#B5E5CF")} />
                <div className="picker-color" style={{backgroundColor: "#A0E7E5"}} onClick={() => changeColor("#A0E7E5")} />
                <div className="picker-color" style={{backgroundColor: "#00B7BE"}} onClick={() => changeColor("#00B7BE")} />
                <div className="picker-color" style={{backgroundColor: "#3D5B59"}} onClick={() => changeColor("#3D5B59")} />
                <div className="picker-color" style={{backgroundColor: "#0C1446"}} onClick={() => changeColor("#0C1446")} />
              </div>

              <input className="input" type="color" value={colorCode} onChange={(e) => changeColor(e.target.value)} />
            </div>
          </div>
        </div>
      )
    }
  }, [ pickerIsActive, colorCode, changeColor ])

  return (
    <div className="is-relative">
      <button className="button picker-button" style={{backgroundColor: colorCode}} onClick={() => setPickerIsActive(!pickerIsActive)}>
        {colorCode}
      </button>

      { renderPicker }
    </div>
  )
}

export default ColorPicker
