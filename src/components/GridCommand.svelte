<script>
  let commandPhase = 0;
  const COMMAND_PHASES = ['Specify the size of the plateau as x,y', 'test'];
  let commands = '';
  $: commands;
</script>

<div
  class="py-8 px-8 max-w-sm mx-auto bg-gray-800 rounded-xl shadow-md space-y-2 sm:py-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-6 text-white fond-bold font-inter"
>
  <p class="font-bold pb-1">&gt;</p>
  <input
    bind:value="{commands}"
    on:input="{() => {
      commands = commands.toUpperCase();
    }}"
    class="font-bold bg-gray-800 text-white w-full"
  />
</div>
