import { useSessionStore } from '../../store/session.store';

export default function PromptAssist() {
  const { setOverrideProvider } = useSessionStore();

  return (
    <div className="space-y-5">
      
      <div>
          <label className="label block mb-3">Enhancement Style</label>
          <div className="space-y-2">
              <button className="prompt-style-btn aw-btn-outline w-full py-3 rounded-xl text-left px-4 text-sm active border-studio-text">
                  <span className="font-medium">Descriptive</span>
                  <span className="block text-xs text-studio-muted mt-0.5">Rich detail, atmospheric, cinematic</span>
              </button>
              <button className="prompt-style-btn aw-btn-outline w-full py-3 rounded-xl text-left px-4 text-sm border-studio-border-light">
                  <span className="font-medium">Technical</span>
                  <span className="block text-xs text-studio-muted mt-0.5">Precise, structured, parameter-focused</span>
              </button>
              <button className="prompt-style-btn aw-btn-outline w-full py-3 rounded-xl text-left px-4 text-sm border-studio-border-light">
                  <span className="font-medium">Concise</span>
                  <span className="block text-xs text-studio-muted mt-0.5">Short, punchy, keyword-optimized</span>
              </button>
          </div>
      </div>

      <div>
          <label className="label block mb-3">Target Model</label>
          <select 
            onChange={(e) => setOverrideProvider(e.target.value)}
            className="aw-input w-full px-4 py-3 rounded-xl text-sm appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[right_1rem_center] bg-[length:1rem]"
          >
              <option value="">Auto</option>
              <option value="openai">DALL-E 3</option>
              <option value="google">Gemini</option>
              <option value="replicate">Flux / SDXL</option>
          </select>
      </div>

    </div>
  );
}
