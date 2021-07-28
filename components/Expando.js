import styles from '../styles/Expando.module.css'
import React, { useEffect, useRef, useState } from 'react'
import MarkdownIt from 'markdown-it';

function Expando(props){
    const { arrayLimit, htmlLengthLimit } = props; 
    const [isOpen, setIsOpen] = useState(false);

    
    const { content } = useRef(null);

    // TODO: this is pretty gross
    var isLong = false;
    if(htmlLengthLimit){
        //isLong = content.current.offsetHeight > content.current.scrollWidth;
        //isLong = (!!props.children.props && props.children.props.dangerouslySetInnerHTML.__html.length > htmlLengthLimit)
    }else if(arrayLimit){
    //    isLong = typeof(props.children) == 'array' && props.children[0].length > arrayLimit;
    }
    useEffect(() =>{
        isLong = content == null ? false : content.current.offsetHeight != content.current.scrollWidth;
if(content != null){
    console.log(`$$$$$$$$$$$$$$$$ ${content.current.offsetHeight} > ${content.current.scrollWidth} = ${isLong}`);
}
    }, [content])
    
    
    return (
        <>
        <div>{isLong}</div>
            {props.children == null ? <div>No content</div> :
            <div className={styles.parent}>
                {isLong || true ? <div className={styles.button} style={{height: '100%'}} onClick={() => setIsOpen(!isOpen)}>{isOpen ? "Close" : "See more"}|{`${isLong}`}|{!!content ? `${content.current.offsetHeight} ${content.current.scrollWidth}`: null}</div> : null}
                <div ref={content} className={styles.content} style={{maxHeight: isOpen ? '1000px' : '300px', overflow: 'hidden'}}>
                    {props.children}
                </div>
            </div>}
            
        </>
    )
}
export default Expando