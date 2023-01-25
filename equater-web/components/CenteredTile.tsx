import { FC } from 'react'
import { BaseProps } from '../types/BaseProps'

interface Props extends BaseProps {}

const CenteredTile: FC<Props> = (props) => (
    <div className={'centered-tile' + `${props.className ? ` ${props.className}` : ''}`}>
        {props.children}
        <style jsx>{`
            .centered-tile {
                padding: 8rem 2rem;
                margin: 0 auto;
                width: 100%;
                display: flex;
                flex: 1;
                flex-direction: column;
                justify-content: center;
            }

            @media only screen and (min-width: 600px) {
                .centered-tile {
                    width: 400px;
                }
            }
        `}</style>
    </div>
)

export default CenteredTile
