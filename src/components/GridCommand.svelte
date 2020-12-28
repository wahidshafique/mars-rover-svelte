<script lang="ts">
  import COMMAND_PHASES, { CommandPhase } from '../logic/commandPhases';
  import { onMount } from 'svelte';
  let errorMsg: string = '';
  let inputRef: HTMLInputElement;

  onMount(() => {
    inputRef.focus();
  });
  // user inputted
  let commands: string = '';
  let currentPhase: CommandPhase = COMMAND_PHASES[0];

  const findMatchedPhase = (coms: string) => {
    return (
      COMMAND_PHASES.filter((e) => coms && coms.includes(e.qualifier)) || []
    );
  };

  const handleInput = () => {
    const [matchedPhase] = findMatchedPhase(commands.toLowerCase());
    if (matchedPhase) {
      // set current phase
      currentPhase = matchedPhase;
    } else {
      // reset it to the default phase
      currentPhase = COMMAND_PHASES[0];
    }
  };

  const handleSubmit = () => {
    errorMsg = '';
    // if we have a matching qualifier, set our command phase to that (we only care about the last one)
    // only full matches are considered
    const upperCaseCommands = commands.toLowerCase();
    const [matchedPhase] = findMatchedPhase(upperCaseCommands);
    if (matchedPhase) {
      const coords = upperCaseCommands
        .replace(matchedPhase.qualifier, '')
        .trim();
      if (coords.match(matchedPhase.regexTest)) {
        try {
          matchedPhase.commitFn(coords.split(/[ ,]+/));
          // on successful match, reset state
          commands = '';
          currentPhase = COMMAND_PHASES[0];
        } catch (e) {
          // something internal to the function went wrong
          console.error(e);
          errorMsg = e;
        }
      } else {
        // set error message
        errorMsg = matchedPhase.errorMsg;
      }
    } else {
      errorMsg = 'Invalid input';
    }
  };
</script>

<form on:submit|preventDefault="{handleSubmit}">
  <div class="flex flex-row">
    <div
      class="py-8 px-8 ml-4 bg-gray-800 rounded-xl shadow-md space-y-2 sm:py-4 sm:space-y-0 sm:space-x-6 text-white fond-bold font-inter"
    >
      <div class="flex flex-col w-full">
        <p class="flex py-3 self-center">{currentPhase.text}</p>

        <div class="flex flex-row">
          <p class="font-bold pr-2">&gt;</p>
          <input
            aria-label="enter a command"
            bind:this="{inputRef}"
            on:input="{handleInput}"
            bind:value="{commands}"
            class="flex font-bold bg-gray-800 text-white w-full"
          />
        </div>
        <p class="text-red-500 h-4 ml-4 mt-1">{errorMsg}</p>
      </div>
    </div>
    <button
      class="bg-red-500 ml-3 hover:bg-red-400 text-white font-bold py-2 px-4 border-b-4 border-red-700 hover:border-red-500 rounded"
    >
      Send
    </button>
  </div>
</form>
