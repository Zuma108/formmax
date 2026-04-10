import svgPaths from "./svg-nqelq9zwx";

function Group() {
  return (
    <div className="absolute left-[201px] size-[100px] top-[69px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <g id="Group 7">
          <path d={svgPaths.p2acdd000} fill="var(--fill-0, #C44500)" id="Ellipse 5" />
          <circle cx="50" cy="50" fill="var(--fill-0, white)" id="Ellipse 6" r="45" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute bg-[#efefef] content-stretch flex h-[28px] items-center justify-center left-[24px] pl-[5px] pr-[4px] rounded-[30px] top-[31px] w-[138px]">
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[18px] text-black text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[28px]">Form Analysis</p>
      </div>
    </div>
  );
}

export default function Group1() {
  return (
    <div className="relative size-full">
      <div className="absolute bg-white h-[477px] left-0 rounded-bl-[39px] rounded-br-[39px] top-0 w-[393px]" />
      <Group />
      <div className="-translate-y-1/2 absolute flex flex-col font-['SF_Pro:Expanded_Semibold',sans-serif] font-[650] h-[87px] justify-center leading-[0] left-[33px] text-[24px] text-black top-[119.5px] w-[174px]" style={{ fontVariationSettings: "'wdth' 132" }}>
        <p className="leading-[28px]">FORMAX SCORE</p>
      </div>
      <Frame />
    </div>
  );
}