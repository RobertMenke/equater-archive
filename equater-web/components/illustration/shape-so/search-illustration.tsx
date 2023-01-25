import React from 'react'

interface Props {
    className: string
}

export function SearchIllustration(props: Props) {
    return (
        <svg
            className={`illustration ${props.className}`}
            viewBox="0 0 1155 700"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M317.758 289.129H457.648H517.468V364.759H457.648H338.708H337.708H317.758V330.469V329.469V289.129ZM491.698 353.979C492.628 353.979 493.378 353.229 493.378 352.299V338.079C493.378 337.149 492.628 336.399 491.698 336.399H457.648H343.528C342.598 336.399 341.848 337.149 341.848 338.079V352.299C341.848 353.229 342.598 353.979 343.528 353.979H457.648H491.698ZM491.698 322.719C492.628 322.719 493.378 321.969 493.378 321.039V306.819C493.378 305.899 492.628 305.149 491.698 305.149H457.648H343.528C342.598 305.149 341.848 305.899 341.848 306.819V321.039C341.848 321.969 342.598 322.719 343.528 322.719H457.648H491.698ZM337.708 388.129H338.708H457.648H517.468V486.589C517.468 497.849 510.008 507.009 500.838 507.009H457.648H338.708H337.708H334.378C325.208 507.009 317.758 497.849 317.758 486.589V388.129H337.708ZM491.698 478.999C492.628 478.999 493.378 478.249 493.378 477.319V463.099C493.378 462.169 492.628 461.419 491.698 461.419H457.648H343.528C342.598 461.419 341.848 462.169 341.848 463.099V477.319C341.848 478.249 342.598 478.999 343.528 478.999H457.648H491.698ZM491.698 447.739C492.628 447.739 493.378 446.989 493.378 446.069V431.849C493.378 430.919 492.628 430.169 491.698 430.169H457.648H343.528C342.598 430.169 341.848 430.919 341.848 431.849V446.069C341.848 446.989 342.598 447.739 343.528 447.739H457.648H491.698ZM493.378 400.589C493.378 399.659 492.628 398.909 491.698 398.909H457.648H343.528C342.598 398.909 341.848 399.659 341.848 400.589V414.809C341.848 415.739 342.598 416.489 343.528 416.489H457.648H491.698C492.628 416.489 493.378 415.739 493.378 414.809V400.589Z"
                fill="#F1F2F2"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M782.28 243.01C782.19 242.66 782.09 242.31 781.98 241.96C779.71 234.45 775.91 227.27 770.53 220.92C759.28 207.63 742.82 200 725.38 200C715.86 200 706.52 202.32 698.16 206.66C694.28 208.67 690.6 211.13 687.22 213.99C678.39 221.46 672.08 231.14 668.83 241.96L668.83 241.961L668.83 241.962L668.829 241.963L668.829 241.964L668.829 241.965L668.829 241.966L668.828 241.967L668.828 241.968L668.828 241.969L668.828 241.97L668.827 241.971L668.827 241.972C668.718 242.318 668.609 242.664 668.52 243.01C668.42 243.36 668.32 243.71 668.24 244.06C667.37 247.35 666.79 250.75 666.5 254.21C665.93 261.04 666.53 267.79 668.23 274.23C668.4 274.9 668.59 275.57 668.8 276.23C669.92 279.96 671.42 283.58 673.29 287.03C673.47 287.38 673.66 287.73 673.87 288.08C674.06 288.43 674.26 288.78 674.47 289.13C676.16 291.98 678.1 294.72 680.29 297.3C685.33 303.25 691.41 308.07 698.16 311.57C706.48 315.9 715.81 318.23 725.45 318.23C739.39 318.23 752.94 313.26 763.6 304.23C768.81 299.82 773.06 294.7 776.34 289.13C776.55 288.78 776.75 288.43 776.94 288.08C777.14 287.73 777.33 287.38 777.51 287.03C779.37 283.57 780.86 279.95 781.98 276.23C782.18 275.56 782.37 274.9 782.53 274.23C785.13 264.39 785.17 253.98 782.57 244.06C782.48 243.71 782.39 243.36 782.28 243.01ZM756.07 241.96C755.92 242.31 755.75 242.66 755.56 243.01C755.39 243.37 755.2 243.72 755 244.06C753.91 245.91 752.5 247.61 750.77 249.07C742.5 256.07 730.13 255.04 723.13 246.77C722.4 245.91 721.76 245 721.21 244.06C721 243.71 720.81 243.36 720.63 243.01C720.45 242.66 720.28 242.32 720.14 241.96C716.73 234.23 718.65 224.87 725.43 219.13C733.7 212.13 746.07 213.16 753.07 221.43C758.07 227.33 758.97 235.32 756.07 241.96ZM792.64 243.012C792.72 243.362 792.8 243.712 792.87 244.062H792.88C792.81 243.712 792.73 243.362 792.65 243.012H792.64ZM847.38 244.059H840.53H839.44H792.88C794.33 250.599 794.82 257.299 794.35 263.929C794.32 264.469 794.28 265.009 794.22 265.539C794.18 266.079 794.12 266.619 794.05 267.149C793.86 268.729 793.63 270.299 793.34 271.869C793.23 272.429 793.12 272.989 793 273.549C792.96 273.779 792.91 273.999 792.85 274.229H839.44H840.53H842.53C843.08 274.229 843.53 274.679 843.53 275.229C843.53 275.789 843.08 276.229 842.53 276.229H840.53H839.44H792.37L792.25 276.709C792.13 277.209 791.99 277.699 791.84 278.189C791.823 278.232 791.813 278.282 791.805 278.327L791.8 278.349C791.66 278.849 791.51 279.339 791.35 279.829C790.7 281.899 789.95 283.949 789.11 285.959C788.996 286.234 788.875 286.503 788.754 286.775L788.753 286.775L788.753 286.777C788.715 286.861 788.678 286.944 788.64 287.029C788.49 287.379 788.33 287.729 788.17 288.079C788.141 288.141 788.112 288.203 788.084 288.265L788.083 288.266C787.993 288.46 787.904 288.652 787.82 288.849C787.88 288.719 787.94 288.591 788 288.464C788.06 288.336 788.12 288.209 788.18 288.079L788.183 288.072C788.342 287.724 788.501 287.376 788.65 287.029H839.44H840.53H847.38C859.23 287.029 868.86 277.389 868.86 265.539C868.86 253.699 859.23 244.059 847.38 244.059ZM783.77 296.16C783.18 297.09 782.56 298.01 781.92 298.92C782.57 298.01 783.18 297.09 783.77 296.16ZM774.17 210.121C775.55 211.491 776.89 212.941 778.17 214.461C785.16 222.721 789.88 232.141 792.38 241.961L792.382 241.969L792.382 241.971C792.472 242.317 792.561 242.664 792.64 243.011L792.37 241.961C789.87 232.141 785.15 222.721 778.16 214.461C776.88 212.941 775.54 211.501 774.17 210.121ZM765.38 202.699C766.41 203.439 767.42 204.199 768.41 204.989C767.42 204.189 766.41 203.429 765.38 202.699ZM764.12 316.369C761.92 317.859 759.65 319.209 757.34 320.409C759.65 319.199 761.91 317.849 764.11 316.359L764.12 316.369ZM519.3 448.599C519.3 449.179 519.77 449.649 520.35 449.649C520.93 449.649 521.4 449.179 521.4 448.599V388.129H519.3V448.599ZM519.3 289.129H521.4V364.759H519.3V289.129ZM519.23 276.229H518.35H517.47H457.65H365.15C364.6 276.229 364.15 275.789 364.15 275.229C364.15 274.679 364.6 274.229 365.15 274.229H457.65H517.47H518.35H519.23H657.96C655.74 264.269 655.76 253.949 657.96 244.059H457.65H305C293.15 244.059 283.52 253.699 283.52 265.539C283.52 277.389 293.15 287.029 305 287.029H316H316.88H317.76H457.65H517.47H518.35H519.23H519.3H521.4H662.17C660.62 283.519 659.37 279.899 658.44 276.229H519.23ZM357.87 276.229H333.36C332.81 276.229 332.36 275.789 332.36 275.229C332.36 274.679 332.81 274.229 333.36 274.229H357.87C358.42 274.229 358.87 274.679 358.87 275.229C358.87 275.789 358.42 276.229 357.87 276.229ZM457.65 461.422H491.7C492.63 461.422 493.38 462.172 493.38 463.102V477.322C493.38 478.252 492.63 479.002 491.7 479.002H457.65H343.53C342.6 479.002 341.85 478.252 341.85 477.322V463.102C341.85 462.172 342.6 461.422 343.53 461.422H457.65ZM491.7 430.172H457.65H343.53C342.6 430.172 341.85 430.922 341.85 431.852V446.072C341.85 446.992 342.6 447.742 343.53 447.742H457.65H491.7C492.63 447.742 493.38 446.992 493.38 446.072V431.852C493.38 430.922 492.63 430.172 491.7 430.172ZM457.65 398.91H491.7C492.63 398.91 493.38 399.66 493.38 400.59V414.81C493.38 415.74 492.63 416.49 491.7 416.49H457.65H343.53C342.6 416.49 341.85 415.74 341.85 414.81V400.59C341.85 399.66 342.6 398.91 343.53 398.91H457.65ZM491.7 336.398H457.65H343.53C342.6 336.398 341.85 337.148 341.85 338.078V352.298C341.85 353.228 342.6 353.978 343.53 353.978H457.65H491.7C492.63 353.978 493.38 353.228 493.38 352.298V338.078C493.38 337.148 492.63 336.398 491.7 336.398ZM457.65 305.148H491.7C492.63 305.148 493.38 305.898 493.38 306.818V321.038C493.38 321.968 492.63 322.718 491.7 322.718H457.65H343.53C342.6 322.718 341.85 321.968 341.85 321.038V306.818C341.85 305.898 342.6 305.148 343.53 305.148H457.65Z"
                fill="white"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M656.75 104.02C659.102 104.02 660.252 102.109 661.364 100.262L661.39 100.22C662.43 98.46 663.42 96.8 665.34 96.8C667.244 96.8 668.234 98.4496 669.28 100.194L669.29 100.21L669.292 100.214C670.401 102.082 671.551 104.02 673.93 104.02C676.298 104.02 677.448 102.082 678.558 100.214L678.56 100.21L678.586 100.167C679.626 98.4329 680.606 96.8 682.51 96.8C684.414 96.8 685.394 98.4329 686.434 100.167L686.46 100.21L686.462 100.214C687.571 102.083 688.721 104.02 691.1 104.02C693.468 104.02 694.618 102.082 695.728 100.214L695.73 100.21L695.756 100.167C696.796 98.433 697.776 96.8 699.68 96.8C701.584 96.8 702.564 98.4328 703.604 100.167L703.63 100.21L703.632 100.214C704.741 102.083 705.891 104.02 708.26 104.02C710.638 104.02 711.788 102.082 712.898 100.214L712.9 100.21C713.94 98.46 714.93 96.8 716.84 96.8C718.76 96.8 719.75 98.46 720.79 100.21L720.792 100.214C721.901 102.082 723.051 104.02 725.43 104.02C727.798 104.02 728.948 102.082 730.058 100.214L730.06 100.21L730.086 100.167C731.126 98.4329 732.106 96.8 734.01 96.8C735.914 96.8 736.894 98.4329 737.934 100.167L737.96 100.21L737.962 100.214C739.071 102.083 740.221 104.02 742.59 104.02C744.968 104.02 746.118 102.082 747.228 100.214L747.23 100.21C748.27 98.46 749.26 96.8 751.18 96.8C753.09 96.8 754.08 98.46 755.12 100.21L755.122 100.214C756.231 102.082 757.381 104.02 759.76 104.02C762.128 104.02 763.278 102.083 764.387 100.214L764.388 100.214L764.39 100.21L764.416 100.167C765.456 98.4328 766.436 96.8 768.34 96.8C770.244 96.8 771.224 98.4327 772.264 100.167L772.264 100.167L772.29 100.21L772.292 100.214C773.401 102.082 774.551 104.02 776.92 104.02C779.298 104.02 780.448 102.082 781.558 100.214L781.56 100.21C782.6 98.46 783.59 96.8 785.5 96.8C787.42 96.8 788.41 98.46 789.45 100.21L789.452 100.214L789.452 100.214C790.562 102.083 791.712 104.02 794.08 104.02C794.31 104.02 794.48 103.84 794.48 103.61C794.48 103.39 794.31 103.21 794.08 103.21C792.17 103.21 791.18 101.56 790.14 99.8C789.03 97.93 787.88 96 785.5 96C783.13 96 781.98 97.93 780.87 99.8C779.83 101.56 778.84 103.21 776.92 103.21C775.01 103.21 774.02 101.56 772.98 99.8L772.972 99.7861L772.971 99.7858C771.854 97.9203 770.704 96 768.34 96C765.976 96 764.826 97.9203 763.708 99.7859L763.7 99.8C762.66 101.56 761.68 103.21 759.76 103.21C757.844 103.21 756.864 101.567 755.817 99.8119L755.81 99.8C754.7 97.93 753.55 96 751.18 96C748.8 96 747.65 97.93 746.54 99.8C745.5 101.56 744.51 103.21 742.59 103.21C740.68 103.21 739.69 101.56 738.65 99.8L738.641 99.7859C737.524 97.9203 736.374 96 734.01 96C731.646 96 730.496 97.9203 729.378 99.7859L729.37 99.8C728.33 101.56 727.34 103.21 725.43 103.21C723.51 103.21 722.52 101.56 721.48 99.8C720.37 97.93 719.22 96 716.84 96C714.47 96 713.32 97.93 712.21 99.8L712.203 99.8119V99.812C711.155 101.567 710.176 103.21 708.26 103.21C706.34 103.21 705.36 101.56 704.32 99.8L704.312 99.7861C703.194 97.9204 702.044 96 699.68 96C697.316 96 696.166 97.9204 695.048 99.7861L695.04 99.8C694 101.56 693.01 103.21 691.1 103.21C689.18 103.21 688.19 101.56 687.15 99.8C686.04 97.93 684.88 96 682.51 96C680.14 96 678.98 97.93 677.87 99.8C676.83 101.56 675.84 103.21 673.93 103.21C672.01 103.21 671.02 101.56 669.98 99.8L669.972 99.7861C668.854 97.9204 667.704 96 665.34 96C662.96 96 661.81 97.93 660.7 99.8L660.693 99.8121C659.645 101.568 658.665 103.21 656.75 103.21C656.52 103.21 656.34 103.39 656.34 103.61C656.34 103.84 656.52 104.02 656.75 104.02ZM856.4 102.078H867.99V113.668H856.4V102.078ZM840.53 274.23H842.53C843.08 274.23 843.53 274.68 843.53 275.23C843.53 275.79 843.08 276.23 842.53 276.23H840.53H839.44H792.37C792.55 275.57 792.71 274.9 792.85 274.23H839.44H840.53ZM799.02 568.449H746.31C745.95 568.449 745.67 568.729 745.67 569.079C745.67 569.439 745.95 569.719 746.31 569.719H799.02C799.37 569.719 799.65 569.439 799.65 569.079C799.65 568.729 799.37 568.449 799.02 568.449ZM791.14 558.34C791.49 558.34 791.78 558.63 791.78 558.98C791.78 559.33 791.49 559.62 791.14 559.62H726.19C725.84 559.62 725.55 559.33 725.55 558.98C725.55 558.63 725.84 558.34 726.19 558.34H791.14ZM725.43 219.129C718.65 224.869 716.73 234.229 720.14 241.959C720.28 242.319 720.45 242.659 720.63 243.009C720.81 243.359 721 243.709 721.21 244.059C721.76 244.999 722.4 245.909 723.13 246.769C730.13 255.039 742.5 256.069 750.77 249.069C752.5 247.609 753.91 245.909 755 244.059C755.2 243.719 755.39 243.369 755.56 243.009C755.75 242.659 755.92 242.309 756.07 241.959C758.97 235.319 758.07 227.329 753.07 221.429C746.07 213.159 733.7 212.129 725.43 219.129ZM698.16 417.422H732.51V499.942H698.16H649.99V417.422H698.16ZM698.16 497.942H730.51V419.422H698.16H651.99V497.942H698.16ZM615.68 417.422H633.1V499.942H615.68V417.422ZM594.99 364.762H521.4H519.3H519.23H518.35H517.47H457.65H338.71H337.71H317.76H316.88H316H294.29H293.29H240.24C239 364.762 238 365.762 238 367.002V385.892C238 387.132 239 388.132 240.24 388.132H293.29H294.29H316H316.88H317.76H337.71H338.71H457.65H517.47H518.35H519.23H519.3H521.4H594.99C596.23 388.132 597.23 387.132 597.23 385.892V367.002C597.23 365.762 596.23 364.762 594.99 364.762ZM614.67 170.282H541.14C533.41 170.282 527.12 163.992 527.12 156.252V143.922V131.922H628.7V143.922V156.252C628.7 163.992 622.41 170.282 614.67 170.282ZM529.12 133.922V143.922V156.252C529.12 162.882 534.51 168.282 541.14 168.282H614.67C621.3 168.282 626.7 162.882 626.7 156.252V143.922V133.922H529.12ZM365.15 276.23H457.65H517.47H518.35H519.23H658.44C658.27 275.57 658.11 274.9 657.96 274.23H519.23H518.35H517.47H457.65H365.15C364.6 274.23 364.15 274.68 364.15 275.23C364.15 275.79 364.6 276.23 365.15 276.23ZM457.65 218.17H383.19C380.65 218.17 378.6 216.12 378.6 213.58C378.6 212.31 379.11 211.16 379.94 210.33C380.77 209.5 381.92 208.98 383.19 208.98H457.65H495.62C498.15 208.98 500.21 211.04 500.21 213.58C500.21 214.85 499.7 216 498.86 216.83C498.03 217.66 496.88 218.17 495.62 218.17H457.65ZM429.63 558.34H364.68C364.33 558.34 364.04 558.63 364.04 558.98C364.04 559.33 364.33 559.62 364.68 559.62H429.63C429.98 559.62 430.27 559.33 430.27 558.98C430.27 558.63 429.98 558.34 429.63 558.34ZM411.82 175.789H423.41V187.369H411.82V175.789ZM409.51 568.449H356.8C356.45 568.449 356.16 568.729 356.16 569.079C356.16 569.439 356.45 569.719 356.8 569.719H409.51C409.86 569.719 410.15 569.439 410.15 569.079C410.15 568.729 409.86 568.449 409.51 568.449ZM357.87 276.23H333.36C332.81 276.23 332.36 275.79 332.36 275.23C332.36 274.68 332.81 274.23 333.36 274.23H357.87C358.42 274.23 358.87 274.68 358.87 275.23C358.87 275.79 358.42 276.23 357.87 276.23Z"
                fill="#FCAACF"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M260.88 108.859C260.3 108.859 259.83 109.329 259.83 109.909V253.399C259.83 253.979 260.3 254.449 260.88 254.449C261.46 254.449 261.93 253.979 261.93 253.399V109.909C261.93 109.329 261.46 108.859 260.88 108.859ZM364.71 117.191H405.74V124.341H364.71V117.191ZM364.71 134.629H440.98V141.779H364.71V134.629ZM678.9 187.43C679.74 186.6 680.25 185.46 680.25 184.19C680.25 181.65 678.19 179.59 675.65 179.59H648.94C647.67 179.59 646.52 180.1 645.69 180.94C644.86 181.77 644.34 182.92 644.34 184.19C644.34 186.72 646.4 188.78 648.94 188.78H675.65C676.92 188.78 678.07 188.26 678.9 187.43ZM839.44 241.962V196.172H884.96V347.922V441.522V442.092H862.2V481.452C861.35 480.312 860.31 479.442 858.72 479.442C856.34 479.442 855.19 481.372 854.08 483.242C853.04 484.992 852.05 486.652 850.13 486.652C848.22 486.652 847.23 484.992 846.19 483.242C845.08 481.372 843.93 479.442 841.55 479.442C839.18 479.442 838.03 481.372 836.92 483.242L836.895 483.285C835.854 485.019 834.874 486.652 832.97 486.652C831.066 486.652 830.086 485.019 829.046 483.285L829.02 483.242C827.91 481.372 826.76 479.442 824.39 479.442C822.01 479.442 820.86 481.372 819.75 483.242C818.71 484.992 817.72 486.652 815.8 486.652C813.89 486.652 812.9 484.992 811.86 483.242L811.852 483.228L811.852 483.228C810.734 481.362 809.584 479.442 807.22 479.442C804.856 479.442 803.706 481.362 802.589 483.228L802.58 483.242L802.57 483.26C801.534 485.003 800.554 486.652 798.64 486.652C798.56 486.652 798.48 486.652 798.41 486.642V356.892L821.95 384.702C824.6 387.842 829.31 388.232 832.45 385.572C834.19 384.102 835.09 382.002 835.09 379.882C835.09 378.182 834.51 376.472 833.32 375.072L799.18 334.732C802.36 320.472 815.09 309.822 830.31 309.822C833.48 309.822 836.55 310.282 839.44 311.152V289.132H840.53V311.502C845.23 313.082 849.43 315.732 852.86 319.162C858.63 324.932 862.2 332.902 862.2 341.712V440.992H883.86V197.272H840.53V241.962H839.44ZM731.51 354.66H698.16H650.99C650.44 354.66 649.99 355.11 649.99 355.66C649.99 356.21 650.44 356.66 650.99 356.66H698.16H731.51C732.07 356.66 732.51 356.21 732.51 355.66C732.51 355.11 732.07 354.66 731.51 354.66ZM698.16 380.699H731.51C732.07 380.699 732.51 381.149 732.51 381.699C732.51 382.249 732.07 382.699 731.51 382.699H698.16H650.99C650.44 382.699 649.99 382.249 649.99 381.699C649.99 381.149 650.44 380.699 650.99 380.699H698.16ZM731.51 393.719H698.16H650.99C650.44 393.719 649.99 394.169 649.99 394.719C649.99 395.269 650.44 395.719 650.99 395.719H698.16H731.51C732.07 395.719 732.51 395.269 732.51 394.719C732.51 394.169 732.07 393.719 731.51 393.719ZM759.424 445.607C761.365 447.548 761.365 450.694 759.424 452.635C757.483 454.576 754.336 454.576 752.395 452.635C750.454 450.695 750.454 447.548 752.395 445.607C754.336 443.666 757.483 443.666 759.424 445.607ZM755.17 456.352H756.66C761.32 456.352 765.11 460.132 765.11 464.802C765.11 465.762 764.32 466.552 763.36 466.552H748.47C747.51 466.552 746.72 465.762 746.72 464.802C746.72 462.462 747.66 460.352 749.19 458.822C750.72 457.302 752.84 456.352 755.17 456.352ZM698.16 369.68H650.99C650.44 369.68 649.99 369.23 649.99 368.68C649.99 368.13 650.44 367.68 650.99 367.68H698.16H718.49C719.04 367.68 719.49 368.13 719.49 368.68C719.49 369.23 719.04 369.68 718.49 369.68H698.16ZM858.72 480.238C856.8 480.238 855.81 481.898 854.77 483.648C853.66 485.518 852.51 487.448 850.13 487.448C847.76 487.448 846.61 485.518 845.5 483.648C844.46 481.898 843.47 480.238 841.55 480.238C839.64 480.238 838.65 481.898 837.61 483.648L837.602 483.662C836.484 485.528 835.334 487.448 832.97 487.448C830.606 487.448 829.456 485.528 828.339 483.662L828.33 483.648C827.29 481.898 826.3 480.238 824.39 480.238C822.47 480.238 821.48 481.898 820.44 483.648C819.33 485.518 818.18 487.448 815.8 487.448C813.43 487.448 812.28 485.518 811.17 483.648L811.145 483.605C810.104 481.871 809.124 480.238 807.22 480.238C805.316 480.238 804.336 481.871 803.296 483.605L803.27 483.648C802.16 485.518 801.01 487.448 798.64 487.448C798.56 487.448 798.48 487.448 798.41 487.438V522.738C798.41 540.358 812.69 554.638 830.31 554.638C847.92 554.638 862.2 540.358 862.2 522.738V482.888C861.31 481.448 860.35 480.238 858.72 480.238ZM657.56 527.32H664.98C667.23 527.32 669.06 529.14 669.06 531.39V535.5C669.06 537.75 667.23 539.57 664.98 539.57H657.56C655.31 539.57 653.48 537.75 653.48 535.5V531.39C653.48 529.14 655.31 527.32 657.56 527.32ZM577.91 516.059C568.31 516.059 560.52 523.839 560.52 533.449C560.52 543.049 568.31 550.829 577.91 550.829C587.51 550.829 595.3 543.049 595.3 533.449C595.3 523.839 587.51 516.059 577.91 516.059ZM511.31 184.19C511.31 182 513.09 180.23 515.27 180.23C517.46 180.23 519.23 182 519.23 184.19C519.23 186.37 517.46 188.14 515.27 188.14C513.09 188.14 511.31 186.37 511.31 184.19ZM498.26 527.32H490.83C488.58 527.32 486.76 529.14 486.76 531.39V535.5C486.76 537.75 488.58 539.57 490.83 539.57H498.26C500.51 539.57 502.33 537.75 502.33 535.5V531.39C502.33 529.14 500.51 527.32 498.26 527.32ZM501.36 184.19C501.36 186.37 499.58 188.14 497.4 188.14C495.21 188.14 493.44 186.37 493.44 184.19C493.44 182 495.21 180.23 497.4 180.23C499.58 180.23 501.36 182 501.36 184.19ZM479.53 180.23C477.34 180.23 475.57 182 475.57 184.19C475.57 186.37 477.34 188.14 479.53 188.14C481.71 188.14 483.48 186.37 483.48 184.19C483.48 182 481.71 180.23 479.53 180.23ZM405.74 152.078H364.71V159.218H405.74V152.078ZM337.71 533.979H294.29V388.129H293.29V534.979H338.71V509.169H337.71V533.979ZM316 330.469H294.29V364.759H293.29V329.469H316V330.469ZM249.73 131.359C249.73 130.779 250.201 130.309 250.78 130.309C251.36 130.309 251.83 130.779 251.83 131.359V308.169C251.83 308.749 251.36 309.219 250.78 309.219C250.201 309.219 249.73 308.749 249.73 308.169V131.359Z"
                fill="#E6E7E8"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M294.629 185.19H352.269C359.139 185.19 364.709 179.61 364.709 172.74V159.22V152.08V141.78V134.63V124.34V117.19V115.1C364.709 108.23 359.139 102.66 352.269 102.66H294.629C287.749 102.66 282.179 108.23 282.179 115.1V172.74C282.179 179.61 287.749 185.19 294.629 185.19ZM284.179 117.1C284.179 110.23 289.749 104.66 296.629 104.66H350.269C357.139 104.66 362.709 110.23 362.709 117.1V170.74C362.709 177.61 357.139 183.19 350.269 183.19H296.629C289.749 183.19 284.179 177.61 284.179 170.74V117.1ZM330.859 134.629C330.859 138.729 327.539 142.049 323.449 142.049C319.349 142.049 316.029 138.729 316.029 134.629C316.029 130.539 319.349 127.219 323.449 127.219C327.539 127.219 330.859 130.539 330.859 134.629ZM541.139 168.282H614.669C621.299 168.282 626.699 162.882 626.699 156.252V143.922H529.119V156.252C529.119 162.882 534.509 168.282 541.139 168.282ZM896.369 172.522H719.559C718.979 172.522 718.509 172.052 718.509 171.472C718.509 170.892 718.979 170.422 719.559 170.422H896.369C896.949 170.422 897.419 170.892 897.419 171.472C897.419 172.052 896.949 172.522 896.369 172.522ZM774.329 180.531H917.819C918.399 180.531 918.869 181.001 918.869 181.581C918.869 182.161 918.399 182.631 917.819 182.631H774.329C773.749 182.631 773.279 182.161 773.279 181.581C773.279 181.001 773.749 180.531 774.329 180.531ZM890.199 350.302C888.839 348.942 886.999 348.052 884.959 347.922V441.522C889.219 441.242 892.589 437.702 892.589 433.372V356.082C892.589 353.822 891.679 351.782 890.199 350.302ZM282.539 593.031H873.279C876.039 593.031 878.279 595.261 878.279 598.031C878.279 600.791 876.039 603.031 873.279 603.031H282.539C279.779 603.031 277.539 600.791 277.539 598.031C277.539 595.261 279.779 593.031 282.539 593.031ZM884.459 486.651C882.545 486.651 881.565 485.003 880.529 483.259L880.519 483.241L880.51 483.227C879.393 481.362 878.243 479.441 875.879 479.441C873.509 479.441 872.359 481.371 871.249 483.241L871.223 483.284C870.183 485.018 869.203 486.651 867.299 486.651C865.394 486.651 864.415 485.018 863.374 483.284L863.349 483.241L863.329 483.208C862.975 482.608 862.611 481.991 862.199 481.451C861.349 480.311 860.309 479.441 858.719 479.441C856.339 479.441 855.189 481.371 854.079 483.241C853.039 484.991 852.049 486.651 850.129 486.651C848.219 486.651 847.229 484.991 846.189 483.241C845.079 481.371 843.929 479.441 841.549 479.441C839.179 479.441 838.029 481.371 836.919 483.241L836.893 483.284C835.853 485.018 834.873 486.651 832.969 486.651C831.065 486.651 830.085 485.019 829.045 483.285L829.019 483.241C827.909 481.371 826.759 479.441 824.389 479.441C822.009 479.441 820.859 481.371 819.749 483.241C818.709 484.991 817.719 486.651 815.799 486.651C813.889 486.651 812.899 484.991 811.859 483.241L811.85 483.227C810.733 481.362 809.583 479.441 807.219 479.441C804.855 479.441 803.705 481.362 802.587 483.227L802.579 483.241L802.568 483.259C801.532 485.003 800.552 486.651 798.639 486.651C798.598 486.651 798.557 486.651 798.518 486.65C798.48 486.649 798.443 486.646 798.409 486.641C796.655 486.513 795.716 484.951 794.717 483.288L794.689 483.241C793.579 481.371 792.429 479.441 790.059 479.441C787.679 479.441 786.529 481.371 785.419 483.241C784.379 484.991 783.389 486.651 781.469 486.651C779.565 486.651 778.585 485.019 777.545 483.285L777.519 483.241C776.409 481.371 775.259 479.441 772.889 479.441C770.509 479.441 769.359 481.371 768.249 483.241C767.209 484.991 766.219 486.651 764.299 486.651C762.394 486.651 761.415 485.018 760.374 483.284L760.349 483.241C759.239 481.371 758.089 479.441 755.709 479.441C753.345 479.441 752.195 481.362 751.077 483.227L751.069 483.241C750.029 484.991 749.039 486.651 747.119 486.651C746.899 486.651 746.719 486.831 746.719 487.051C746.719 487.271 746.899 487.451 747.119 487.451C749.499 487.451 750.649 485.521 751.759 483.651L751.785 483.608C752.825 481.874 753.805 480.241 755.709 480.241C757.629 480.241 758.619 481.901 759.659 483.651L759.667 483.665C760.784 485.531 761.935 487.451 764.299 487.451C766.679 487.451 767.829 485.521 768.939 483.651C769.979 481.901 770.969 480.241 772.889 480.241C774.799 480.241 775.789 481.901 776.829 483.651L776.837 483.666C777.955 485.531 779.105 487.451 781.469 487.451C783.849 487.451 784.999 485.521 786.109 483.651C787.149 481.901 788.139 480.241 790.059 480.241C791.969 480.241 792.959 481.901 793.999 483.651C795.069 485.461 796.179 487.321 798.409 487.441C798.479 487.451 798.559 487.451 798.639 487.451C801.009 487.451 802.159 485.521 803.269 483.651L803.295 483.608C804.335 481.874 805.315 480.241 807.219 480.241C809.123 480.241 810.103 481.874 811.143 483.609L811.169 483.651C812.279 485.521 813.429 487.451 815.799 487.451C818.179 487.451 819.329 485.521 820.439 483.651C821.479 481.901 822.469 480.241 824.389 480.241C826.299 480.241 827.289 481.901 828.329 483.651L828.337 483.666C829.455 485.531 830.605 487.451 832.969 487.451C835.333 487.451 836.483 485.531 837.6 483.665L837.609 483.651C838.649 481.901 839.639 480.241 841.549 480.241C843.469 480.241 844.459 481.901 845.499 483.651C846.609 485.521 847.759 487.451 850.129 487.451C852.509 487.451 853.659 485.521 854.769 483.651C855.809 481.901 856.799 480.241 858.719 480.241C860.349 480.241 861.309 481.451 862.199 482.891C862.282 483.031 862.369 483.17 862.456 483.312C862.489 483.366 862.522 483.42 862.555 483.475C862.59 483.534 862.625 483.592 862.659 483.651L862.667 483.665C863.784 485.531 864.935 487.451 867.299 487.451C869.663 487.451 870.813 485.531 871.93 483.666L871.931 483.665L871.939 483.651L871.949 483.634C872.985 481.89 873.965 480.241 875.879 480.241C877.783 480.241 878.763 481.874 879.803 483.608L879.829 483.651C880.939 485.521 882.089 487.451 884.459 487.451C884.679 487.451 884.859 487.271 884.859 487.051C884.859 486.831 884.679 486.651 884.459 486.651ZM776.559 466.552C775.589 466.552 774.809 465.762 774.809 464.802C774.809 462.462 775.759 460.352 777.279 458.822C778.809 457.302 780.919 456.352 783.259 456.352H784.739C789.409 456.352 793.189 460.132 793.189 464.802C793.189 465.762 792.409 466.552 791.439 466.552H776.559ZM787.514 452.635C789.455 450.695 789.455 447.548 787.514 445.607C785.573 443.666 782.426 443.666 780.485 445.607C778.544 447.548 778.544 450.695 780.485 452.635C782.426 454.576 785.573 454.576 787.514 452.635ZM651.989 419.422H698.159V497.942H651.989V419.422ZM283.809 210.33C284.639 209.5 285.789 208.98 287.059 208.98H359.829C362.369 208.98 364.419 211.04 364.419 213.58C364.419 214.85 363.909 216 363.079 216.83C362.249 217.66 361.099 218.17 359.829 218.17H287.059C284.519 218.17 282.469 216.12 282.469 213.58C282.469 212.31 282.979 211.16 283.809 210.33ZM312.339 160.63H334.549C335.269 160.63 335.919 160.34 336.399 159.86C336.87 159.39 337.159 158.74 337.159 158.02C337.159 151.05 331.519 145.41 324.549 145.41H322.339C318.859 145.41 315.709 146.82 313.419 149.1C311.139 151.38 309.729 154.54 309.729 158.02C309.729 159.46 310.899 160.63 312.339 160.63ZM315.999 289.132H304.999C291.999 289.132 281.419 278.552 281.419 265.542C281.419 252.542 291.999 241.962 304.999 241.962H457.649V218.172H495.619C496.879 218.172 498.029 217.662 498.859 216.832C499.699 216.002 500.209 214.852 500.209 213.582C500.209 211.042 498.149 208.982 495.619 208.982H457.649V172.552C457.649 156.742 470.469 143.922 486.279 143.922H527.119V156.252C527.119 163.992 533.409 170.282 541.139 170.282H614.669C622.409 170.282 628.699 163.992 628.699 156.252V143.922H669.529C685.349 143.922 698.159 156.742 698.159 172.552V195.582C699.429 195.032 700.719 194.532 702.019 194.062C702.969 193.722 703.919 193.402 704.879 193.102C705.829 192.812 706.789 192.532 707.749 192.282C710.639 191.522 713.569 190.952 716.519 190.572C717.449 190.452 718.389 190.352 719.329 190.262C721.349 190.092 723.359 190.002 725.379 190.002C739.489 190.002 753.519 194.302 765.379 202.702C766.409 203.442 767.419 204.202 768.409 204.992C770.409 206.582 772.329 208.292 774.169 210.122C775.539 211.502 776.879 212.942 778.159 214.462C785.149 222.722 789.869 232.142 792.369 241.962L792.639 243.012C792.719 243.362 792.799 243.712 792.869 244.062H792.879C794.329 250.602 794.819 257.302 794.349 263.932C794.309 264.472 794.269 265.002 794.219 265.542C794.169 266.082 794.109 266.622 794.049 267.152C793.859 268.732 793.629 270.302 793.339 271.872C793.229 272.432 793.119 272.992 792.999 273.552C792.974 273.667 792.949 273.779 792.924 273.892C792.899 274.004 792.874 274.117 792.849 274.232C792.699 274.902 792.539 275.562 792.369 276.232L792.249 276.712C792.119 277.202 791.979 277.702 791.839 278.192C791.827 278.221 791.819 278.254 791.812 278.286C791.807 278.309 791.803 278.331 791.799 278.352C791.703 278.671 791.608 278.986 791.512 279.299C791.458 279.477 791.403 279.654 791.349 279.832C790.699 281.902 789.949 283.952 789.109 285.962C788.959 286.322 788.799 286.672 788.639 287.032C788.49 287.38 788.331 287.728 788.172 288.076L788.169 288.082C788.14 288.145 788.111 288.207 788.082 288.268C787.992 288.463 787.902 288.655 787.819 288.852C787.939 288.592 788.059 288.342 788.179 288.082C788.339 287.732 788.499 287.382 788.649 287.032H839.439H840.529H847.379C859.229 287.032 868.859 277.392 868.859 265.542C868.859 253.702 859.229 244.062 847.379 244.062H840.529H839.439H792.879C792.809 243.712 792.729 243.362 792.649 243.012H792.639C792.56 242.665 792.47 242.317 792.381 241.97L792.379 241.962H839.439H840.529H847.379C860.389 241.962 870.959 252.542 870.959 265.542C870.959 278.552 860.389 289.132 847.379 289.132H840.529H839.439H787.679C787.489 289.522 787.299 289.902 787.099 290.292C787.084 290.327 787.066 290.362 787.049 290.397C787.031 290.432 787.014 290.467 786.999 290.502C786.799 290.892 786.599 291.282 786.389 291.672L786.209 292.002C785.969 292.442 785.729 292.882 785.479 293.322C785.209 293.802 784.929 294.282 784.639 294.752C784.359 295.222 784.069 295.692 783.769 296.162C783.179 297.092 782.559 298.012 781.919 298.922C781.069 300.132 780.179 301.312 779.239 302.462C779.029 302.742 778.789 303.032 778.549 303.312C778.399 303.487 778.251 303.662 778.104 303.837C777.956 304.012 777.809 304.187 777.659 304.362C777.542 304.493 777.425 304.624 777.31 304.755C777.09 305.003 776.872 305.25 776.649 305.492C776.269 305.912 775.879 306.332 775.489 306.742L799.179 334.732L833.319 375.072C834.509 376.472 835.089 378.182 835.089 379.882C835.089 382.002 834.189 384.102 832.449 385.572C829.309 388.232 824.599 387.842 821.949 384.702L798.409 356.892L764.119 316.372L764.109 316.362C761.909 317.852 759.649 319.202 757.339 320.412C756.949 320.612 756.559 320.812 756.179 321.002L755.009 321.572C754.619 321.762 754.229 321.942 753.829 322.122C753.439 322.292 753.049 322.472 752.649 322.642C752.42 322.742 752.187 322.838 751.953 322.935C751.789 323.003 751.624 323.072 751.459 323.142C751.371 323.177 751.283 323.212 751.196 323.247C750.887 323.372 750.581 323.495 750.269 323.612C749.869 323.772 749.459 323.922 749.059 324.062C748.729 324.182 748.399 324.302 748.059 324.412C747.809 324.502 747.559 324.592 747.309 324.672C746.959 324.802 746.609 324.912 746.249 325.022C745.669 325.202 745.099 325.372 744.519 325.542C744.039 325.682 743.549 325.812 743.069 325.942C742.089 326.202 741.119 326.432 740.139 326.652C739.659 326.752 739.189 326.852 738.709 326.942C738.371 327.011 738.037 327.07 737.702 327.13C737.552 327.157 737.401 327.184 737.249 327.212C736.789 327.292 736.329 327.362 735.869 327.432C735.749 327.462 735.629 327.482 735.509 327.492C734.619 327.622 733.729 327.732 732.839 327.832C732.349 327.882 731.849 327.932 731.359 327.972C730.379 328.052 729.389 328.112 728.409 328.162C727.419 328.212 726.439 328.232 725.449 328.232C723.327 328.232 721.206 328.123 719.094 327.929C719.059 327.926 719.025 327.922 718.991 327.919C718.964 327.916 718.937 327.913 718.909 327.911C717.963 327.821 717.018 327.712 716.076 327.583C715.995 327.572 715.915 327.561 715.834 327.55L715.744 327.537C714.846 327.41 713.95 327.266 713.057 327.104C713.013 327.096 712.969 327.088 712.926 327.08C712.84 327.065 712.754 327.05 712.668 327.034C711.786 326.868 710.907 326.686 710.031 326.486C709.903 326.457 709.774 326.43 709.646 326.4C708.75 326.191 707.858 325.963 706.97 325.718C706.925 325.705 706.88 325.694 706.836 325.682C706.779 325.668 706.722 325.653 706.666 325.637C705.678 325.359 704.695 325.064 703.719 324.742C702.549 324.362 701.389 323.942 700.239 323.492C699.539 323.222 698.849 322.932 698.159 322.642V354.662H650.989C650.439 354.662 649.989 355.112 649.989 355.662C649.989 356.212 650.439 356.662 650.989 356.662H698.159V367.682H650.989C650.439 367.682 649.989 368.132 649.989 368.682C649.989 369.232 650.439 369.682 650.989 369.682H698.159V380.702H650.989C650.439 380.702 649.989 381.152 649.989 381.702C649.989 382.252 650.439 382.702 650.989 382.702H698.159V393.722H650.989C650.439 393.722 649.989 394.172 649.989 394.722C649.989 395.272 650.439 395.722 650.989 395.722H698.159V417.422H649.989V499.942H698.159V535.402C698.159 551.212 685.349 564.032 669.529 564.032H486.279C470.469 564.032 457.649 551.212 457.649 535.402V509.172H338.709H337.709H334.379C324.249 509.172 315.999 499.042 315.999 486.592V388.132H316.879H317.759V486.592C317.759 497.852 325.209 507.012 334.379 507.012H337.709H338.709H457.649H500.839C510.009 507.012 517.469 497.852 517.469 486.592V388.132H518.349H519.229H519.299V448.602C519.299 449.182 519.769 449.652 520.349 449.652C520.929 449.652 521.399 449.182 521.399 448.602V388.132H594.989C596.229 388.132 597.229 387.132 597.229 385.892V367.002C597.229 365.762 596.229 364.762 594.989 364.762H521.399V289.132H519.299V364.762H519.229H518.349H517.469V289.132H457.649H317.759V329.472V330.472V364.762H316.879H315.999V330.472V329.472V289.132ZM498.259 539.572C500.509 539.572 502.329 537.752 502.329 535.502V531.392C502.329 529.142 500.509 527.322 498.259 527.322H490.829C488.579 527.322 486.759 529.142 486.759 531.392V535.502C486.759 537.752 488.579 539.572 490.829 539.572H498.259ZM560.519 533.452C560.519 543.052 568.309 550.832 577.909 550.832C587.509 550.832 595.299 543.052 595.299 533.452C595.299 523.842 587.509 516.062 577.909 516.062C568.309 516.062 560.519 523.842 560.519 533.452ZM657.559 527.322C655.309 527.322 653.479 529.142 653.479 531.392V535.502C653.479 537.752 655.309 539.572 657.559 539.572H664.979C667.229 539.572 669.059 537.752 669.059 535.502V531.392C669.059 529.142 667.229 527.322 664.979 527.322H657.559ZM475.569 184.192C475.569 186.372 477.339 188.142 479.529 188.142C481.709 188.142 483.479 186.372 483.479 184.192C483.479 182.002 481.709 180.232 479.529 180.232C477.339 180.232 475.569 182.002 475.569 184.192ZM615.679 499.942H633.099V417.422H615.679V499.942ZM698.159 206.662C694.279 208.672 690.599 211.132 687.219 213.992C678.389 221.462 672.079 231.142 668.829 241.962L668.829 241.963C668.719 242.313 668.609 242.662 668.519 243.012C668.419 243.362 668.319 243.712 668.239 244.062C667.369 247.352 666.789 250.752 666.499 254.212C665.929 261.042 666.529 267.792 668.229 274.232C668.399 274.902 668.589 275.572 668.799 276.232C669.919 279.962 671.419 283.582 673.289 287.032C673.469 287.382 673.659 287.732 673.869 288.082C674.059 288.432 674.259 288.782 674.469 289.132C676.159 291.982 678.099 294.722 680.289 297.302C685.329 303.252 691.409 308.072 698.159 311.572C706.479 315.902 715.809 318.232 725.449 318.232C739.389 318.232 752.939 313.262 763.599 304.232C768.809 299.822 773.059 294.702 776.339 289.132C776.549 288.782 776.749 288.432 776.939 288.082C777.139 287.732 777.329 287.382 777.509 287.032C779.369 283.572 780.859 279.952 781.979 276.232C782.179 275.562 782.369 274.902 782.529 274.232C785.129 264.392 785.169 253.982 782.569 244.062C782.479 243.712 782.389 243.362 782.279 243.012C782.189 242.662 782.089 242.312 781.979 241.962C779.709 234.452 775.909 227.272 770.529 220.922C759.279 207.632 742.819 200.002 725.379 200.002C715.859 200.002 706.519 202.322 698.159 206.662ZM648.939 179.592C647.669 179.592 646.519 180.102 645.689 180.942C644.859 181.772 644.339 182.922 644.339 184.192C644.339 186.722 646.399 188.782 648.939 188.782H675.649C676.919 188.782 678.069 188.262 678.899 187.432C679.739 186.602 680.249 185.462 680.249 184.192C680.249 181.652 678.189 179.592 675.649 179.592H648.939ZM519.229 184.192C519.229 182.002 517.459 180.232 515.269 180.232C513.089 180.232 511.309 182.002 511.309 184.192C511.309 186.372 513.089 188.142 515.269 188.142C517.459 188.142 519.229 186.372 519.229 184.192ZM493.439 184.192C493.439 186.372 495.209 188.142 497.399 188.142C499.579 188.142 501.359 186.372 501.359 184.192C501.359 182.002 499.579 180.232 497.399 180.232C495.209 180.232 493.439 182.002 493.439 184.192ZM457.649 244.062H304.999C293.149 244.062 283.519 253.702 283.519 265.542C283.519 277.392 293.149 287.032 304.999 287.032H315.999H316.879H317.759H457.649H517.469H518.349H519.229H519.299H521.399H662.169C660.619 283.522 659.369 279.902 658.439 276.232C658.269 275.572 658.109 274.902 657.959 274.232C655.739 264.272 655.759 253.952 657.959 244.062H457.649Z"
                fill="#2249B3"
            />
        </svg>
    )
}