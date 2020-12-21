<script>
  import { xlink_attr } from 'svelte/internal';

  import { gridDimensions } from '../logic/stores';
  // what step we are on
  let commandPhase = 0;
  const COMMAND_PHASES = [
    {
      qualifier: 'PLATEAU:',
      regexTest: /^\d+(?:\s+\d+){1}$/,
      text: 'The size of the PLATEAU as X Y ',
      commitFn: (e) => {
        console.log('hi');
      },
    },
    {
      qualifier: 'LANDING:',
      regexTest: /([+\-]{0,1}[\d]+(?:\.[\\d]+)*)/,
      text: 'Where the rover will land as X Y Direction',
    },
  ];
  let commands = 'PLATEAU: ';
  let currentPhase = COMMAND_PHASES[commandPhase];
</script>

<div
  class="py-8 px-8 max-w-sm mx-auto bg-gray-800 rounded-xl shadow-md space-y-2 sm:py-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-6 text-white fond-bold font-inter"
>
  <div class="flex flex-col w-full">
    <p class="flex py-3 self-center">{currentPhase.text}</p>

    <div class="flex flex-row">
      <p class="font-bold pr-2">&gt;</p>
      <input
        bind:value="{commands}"
        on:input="{() => {
          commands = commands.toUpperCase();
          // if we have a matching qualifier, set our command phase to that (we only care about the last one)
          // only full matches are considered
          const [matchedPhase] = COMMAND_PHASES.filter((e) =>
            commands.includes(e.qualifier)
          );
          if (matchedPhase) {
            const coords = commands.replace(matchedPhase.qualifier, '').trim();
            if (coords.match(matchedPhase.regexTest)) {
              matchedPhase.commitFn();
            }
            // if () {

            // }
            //if (commands.includes )
            // if (commands.includes(currentPhase.qualifier)) {
            //   // run the current phases regex test (if any)

            // }
          }
        }}"
        class="flex font-bold bg-gray-800 text-white w-full"
      />
    </div>
  </div>
</div>
